// Operational capacity is derived from the current workforce instead of being
// manually declared. It is intentionally domain-only so map, matcher and UI
// can consume the same calculation later.
(function attachOperationalCapacity(global) {
    const AVAILABILITY_WEIGHT = Object.freeze({
        available: 1,
        maybe: 0.5,
        busy: 0
    });

    function normalizeCategory(value) {
        return String(value || "").trim().toLowerCase();
    }

    function workerWeight(worker) {
        return AVAILABILITY_WEIGHT[worker?.availability] ?? 0;
    }

    function classifyCapacity(score, total) {
        if (!total || score <= 0) return "unavailable";
        const ratio = score / total;
        if (ratio >= 0.67) return "high";
        if (ratio >= 0.34) return "medium";
        return "low";
    }

    function summarize(workers, options = {}) {
        const category = normalizeCategory(options.category);
        const eligible = (workers || []).filter(worker => {
            if (!category) return true;
            return normalizeCategory(worker.category) === category ||
                (worker.expertise || []).some(item => normalizeCategory(item.category) === category);
        });

        const capacityUnits = eligible.reduce((sum, worker) => sum + workerWeight(worker), 0);
        const available = eligible.filter(worker => worker.availability === "available").length;
        const conditional = eligible.filter(worker => worker.availability === "maybe").length;
        const busy = eligible.filter(worker => worker.availability === "busy").length;

        return {
            category: category || "all",
            workers: eligible.length,
            available,
            conditional,
            busy,
            capacityUnits,
            utilizationPressure: eligible.length ? 1 - (capacityUnits / eligible.length) : 1,
            status: classifyCapacity(capacityUnits, eligible.length)
        };
    }

    function byCategory(workers) {
        const categories = new Set();
        (workers || []).forEach(worker => {
            if (worker.category) categories.add(normalizeCategory(worker.category));
            (worker.expertise || []).forEach(item => {
                if (item.category) categories.add(normalizeCategory(item.category));
            });
        });
        return Array.from(categories).sort().map(category => summarize(workers, { category }));
    }

    global.ChangaCapacity = Object.freeze({ summarize, byCategory });
})(window);
