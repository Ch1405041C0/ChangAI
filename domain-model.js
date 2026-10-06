// chang@ domain model.
// Business rules are deterministic, explainable and specific to the chang@ workflow.

(function () {
    const AVAILABILITY = Object.freeze({
        AVAILABLE: 'available',
        BUSY: 'busy',
        MAYBE: 'maybe'
    });

    const JOB_STATUS = Object.freeze({
        PUBLISHED: 'published',
        MATCHED: 'matched',
        AGREED: 'agreed',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        FAILED: 'failed'
    });

    const JOB_EVENT = Object.freeze({
        STATUS_CHANGED: 'status_changed',
        WORKER_SUGGESTED: 'worker_suggested',
        WORKER_SELECTED: 'worker_selected',
        WORKER_ACCEPTED: 'worker_accepted',
        MILESTONE_COMPLETED: 'milestone_completed',
        CLIENT_CONFIRMED: 'client_confirmed',
        PAYMENT_RECORDED: 'payment_recorded',
        CONTRIBUTION_RECORDED: 'contribution_recorded',
        EXPERIENCE_ACCRUED: 'experience_accrued'
    });

    const STATUS_TRANSITIONS = Object.freeze({
        [JOB_STATUS.PUBLISHED]: [JOB_STATUS.MATCHED, JOB_STATUS.CANCELLED],
        [JOB_STATUS.MATCHED]: [JOB_STATUS.AGREED, JOB_STATUS.PUBLISHED, JOB_STATUS.CANCELLED],
        [JOB_STATUS.AGREED]: [JOB_STATUS.IN_PROGRESS, JOB_STATUS.CANCELLED],
        [JOB_STATUS.IN_PROGRESS]: [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED],
        [JOB_STATUS.COMPLETED]: [],
        [JOB_STATUS.CANCELLED]: [],
        [JOB_STATUS.FAILED]: []
    });

    function createEvent(type, data = {}, meta = {}) {
        return {
            id: meta.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            at: meta.at || new Date().toISOString(),
            actor: meta.actor || null,
            data,
            evidence: Array.isArray(meta.evidence) ? meta.evidence : []
        };
    }

    function normalizeEvent(event) {
        if (!event || typeof event !== 'object') return null;

        if (event.type) {
            return {
                id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                type: event.type,
                at: event.at || new Date().toISOString(),
                actor: event.actor || null,
                data: event.data && typeof event.data === 'object' ? event.data : {},
                evidence: Array.isArray(event.evidence) ? event.evidence : []
            };
        }

        if (event.from || event.to) {
            return createEvent(
                JOB_EVENT.STATUS_CHANGED,
                { from: event.from || null, to: event.to || null },
                {
                    id: event.id,
                    at: event.at,
                    actor: event.actor || null,
                    evidence: event.evidence || []
                }
            );
        }

        return null;
    }

    function appendJobEvent(job, type, data = {}, meta = {}) {
        const normalized = normalizeJob(job);
        const event = createEvent(type, data, meta);
        return {
            ...normalized,
            history: [...normalized.history, event]
        };
    }

    function normalizeWorker(worker) {
        const expertise = Array.isArray(worker.expertise) && worker.expertise.length
            ? worker.expertise
            : [{
                category: worker.category,
                skill: worker.specialty,
                level: worker.jobsCount >= 100 ? 'advanced' : 'intermediate',
                years: null
            }];

        return {
            ...worker,
            availability: worker.availability || AVAILABILITY.AVAILABLE,
            expertise,
            serviceRadiusKm: Number.isFinite(worker.serviceRadiusKm) ? worker.serviceRadiusKm : 8
        };
    }

    function normalizeJob(job) {
        const statusMap = {
            pending: JOB_STATUS.PUBLISHED,
            completed: JOB_STATUS.COMPLETED
        };
        const history = Array.isArray(job.history)
            ? job.history.map(normalizeEvent).filter(Boolean)
            : [];

        return {
            ...job,
            status: statusMap[job.status] || job.status || JOB_STATUS.PUBLISHED,
            history,
            milestones: Array.isArray(job.milestones) ? job.milestones : []
        };
    }

    function parseDistanceKm(value) {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return Number.POSITIVE_INFINITY;
        const parsed = Number.parseFloat(value.replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
    }

    function scoreWorker(request, rawWorker) {
        const worker = normalizeWorker(rawWorker);
        const requestedCategory = request.category || null;
        const requestedSkills = Array.isArray(request.skills) ? request.skills.map(s => String(s).toLowerCase()) : [];
        const distanceKm = Number.isFinite(request.distanceKm)
            ? request.distanceKm
            : parseDistanceKm(worker.distance);

        const categoryMatch = requestedCategory && worker.category === requestedCategory ? 1 : requestedCategory ? 0 : 0.7;
        const expertiseText = worker.expertise
            .map(item => `${item.category || ''} ${item.skill || ''}`.toLowerCase())
            .join(' ');
        const skillMatch = requestedSkills.length
            ? requestedSkills.filter(skill => expertiseText.includes(skill)).length / requestedSkills.length
            : 0.7;

        const availabilityScore = {
            [AVAILABILITY.AVAILABLE]: 1,
            [AVAILABILITY.MAYBE]: 0.65,
            [AVAILABILITY.BUSY]: 0.15
        }[worker.availability] ?? 0.5;

        const distanceScore = Number.isFinite(distanceKm)
            ? Math.max(0, 1 - (distanceKm / Math.max(worker.serviceRadiusKm, 1)))
            : 0.4;
        const ratingScore = Math.max(0, Math.min(1, Number(worker.rating || 0) / 5));
        const historyScore = Math.max(0, Math.min(1, Number(worker.jobsCount || 0) / 150));

        const weights = {
            category: 0.30,
            skills: 0.20,
            availability: 0.20,
            distance: 0.15,
            rating: 0.10,
            history: 0.05
        };

        const total =
            categoryMatch * weights.category +
            skillMatch * weights.skills +
            availabilityScore * weights.availability +
            distanceScore * weights.distance +
            ratingScore * weights.rating +
            historyScore * weights.history;

        return {
            worker,
            score: Math.round(total * 100),
            reasons: {
                category: Math.round(categoryMatch * 100),
                skills: Math.round(skillMatch * 100),
                availability: Math.round(availabilityScore * 100),
                distance: Math.round(distanceScore * 100),
                rating: Math.round(ratingScore * 100),
                history: Math.round(historyScore * 100)
            }
        };
    }

    function rankWorkers(request, workers) {
        return (workers || [])
            .map(worker => scoreWorker(request, worker))
            .sort((a, b) => b.score - a.score);
    }

    function canTransition(job, nextStatus) {
        const current = normalizeJob(job).status;
        return (STATUS_TRANSITIONS[current] || []).includes(nextStatus);
    }

    function transitionJob(job, nextStatus, meta = {}) {
        const normalized = normalizeJob(job);
        if (!canTransition(normalized, nextStatus)) {
            throw new Error(`Transición inválida: ${normalized.status} → ${nextStatus}`);
        }

        const event = createEvent(
            JOB_EVENT.STATUS_CHANGED,
            { from: normalized.status, to: nextStatus },
            meta
        );

        return {
            ...normalized,
            status: nextStatus,
            history: [...normalized.history, event]
        };
    }

    function completeMilestone(job, milestoneId, meta = {}) {
        const normalized = normalizeJob(job);
        const milestones = normalized.milestones.map(milestone => (
            milestone.id === milestoneId
                ? { ...milestone, status: 'completed', completedAt: meta.at || new Date().toISOString() }
                : milestone
        ));

        return appendJobEvent(
            { ...normalized, milestones },
            JOB_EVENT.MILESTONE_COMPLETED,
            { milestoneId },
            meta
        );
    }

    function hydrateState(state) {
        if (!state) return state;
        state.workers = (state.workers || []).map(normalizeWorker);
        state.changas = (state.changas || []).map(normalizeJob);
        return state;
    }

    window.ChangaDomain = {
        AVAILABILITY,
        JOB_STATUS,
        JOB_EVENT,
        STATUS_TRANSITIONS,
        createEvent,
        normalizeEvent,
        appendJobEvent,
        normalizeWorker,
        normalizeJob,
        scoreWorker,
        rankWorkers,
        canTransition,
        transitionJob,
        completeMilestone,
        hydrateState
    };
})();
