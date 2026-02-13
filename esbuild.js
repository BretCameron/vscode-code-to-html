const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const opts = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  mainFields: ["module", "main"],
};

if (watch) {
  esbuild
    .context({
      ...opts,
      plugins: [
        {
          name: "watch-log",
          setup(build) {
            build.onStart(() => console.log("[watch] build started"));
            build.onEnd((result) => {
              if (result.errors.length) console.error("[watch] build failed");
              else console.log("[watch] build finished");
            });
          },
        },
      ],
    })
    .then((ctx) => ctx.watch());
} else {
  esbuild.build(opts);
}
