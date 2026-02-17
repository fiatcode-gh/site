let cache: { quote: string; author: string } | null = null;

export async function getQuote() {
  if (cache) return cache;

  console.log("\nFetching fresh quote...");
  const response = await fetch("https://quotes-github-readme.vercel.app/api");
  const svgText = await response.text();

  cache = {
    quote: svgText.match(/<h3>([\s\S]*?)<\/h3>/)?.[1]?.trim() ?? "",
    author: svgText.match(/<p>([\s\S]*?)<\/p>/)?.[1]?.trim() ?? "",
  };
  console.log("Quote fetched: ", cache);

  return cache;
}
