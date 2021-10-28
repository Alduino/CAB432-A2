// eslint-disable-next-line @typescript-eslint/no-var-requires
const {resolve} = require("path");

module.exports = {
    webpack(config, {isServer}) {
        if (!isServer) return config;

        return {
            ...config,
            entry() {
                return config.entry().then(entry => ({
                    ...entry,
                    worker: resolve("./src/worker/index.ts")
                }));
            }
        };
    }
};
