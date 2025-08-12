export async function sleep(ms: number) {
  return await new Promise((resolve: any) => {
    setTimeout(() => {
      return resolve(true);
    }, ms);
  });
}
