// Backdrops: one per round (summer, autumn, winter) plus the two endings.

export interface Scene {
  file: string;
  artist: string;
  title: string;
  date: string;
  source: string;
}

export const SCENES = {
  harvesters: {
    file: "harvesters",
    artist: "Pieter Bruegel the Elder",
    title: "The Harvesters",
    date: "1565",
    source: "https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder-_The_Harvesters_-_Google_Art_Project.jpg",
  },
  october: {
    file: "october",
    artist: "Limbourg brothers",
    title: "Très Riches Heures du duc de Berry: October",
    date: "1412–16",
    source: "https://commons.wikimedia.org/wiki/File:Les_Tr%C3%A8s_Riches_Heures_du_duc_de_Berry_octobre.jpg",
  },
  february: {
    file: "february",
    artist: "Limbourg brothers",
    title: "Très Riches Heures du duc de Berry: February",
    date: "1412–16",
    source: "https://commons.wikimedia.org/wiki/File:Les_Tr%C3%A8s_Riches_Heures_du_duc_de_Berry_f%C3%A9vrier.jpg",
  },
  burning: {
    file: "burning",
    artist: "Workshop of the Virgil Master",
    title: "The Burning of the Templars, Chroniques de France",
    date: "after 1380",
    source: "https://commons.wikimedia.org/wiki/File:Templars_Burning.jpg",
  },
  wedding: {
    file: "wedding",
    artist: "Pieter Bruegel the Elder",
    title: "The Wedding Dance",
    date: "1566",
    source: "https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder_-_The_Wedding_Dance_-_30.374_-_Detroit_Institute_of_Arts.jpg",
  },
} satisfies Record<string, Scene>;

export const ROUND_SCENES = [SCENES.harvesters, SCENES.october, SCENES.february];
