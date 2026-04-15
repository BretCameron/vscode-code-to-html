export function run(): Promise<void> {
  console.log("");
  console.log("Playground ready — extension loaded, fixtures workspace open.");
  console.log("Close the VS Code window to exit.");
  console.log("");
  return new Promise(() => {});
}
