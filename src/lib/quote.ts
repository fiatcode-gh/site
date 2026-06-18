import quotes from "../data/quotes.json";

export type Quote = { quote: string; author: string };

export function getQuote(): Quote {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
