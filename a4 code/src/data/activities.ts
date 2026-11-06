import type { Activity } from "../domain/types"

export const activities: Activity[] = [
  {
    id: "paper-bridge",
    title: "Paper Bridge",
    level: "Grade 7",
    durationMinutes: 45,
    topic: "Engineering",
    materials: ["Paper (10 sheets)", "Tape", "Two books", "Small weights"],
    description: "Build and test a bridge using simple materials.",
    preparation: "Prepare the paper and tape before the session.",
    steps: [
      "Fold the paper into different shapes.",
      "Build a bridge between two books.",
      "Place weights on the bridge.",
      "Record which design supports the greatest weight.",
    ],
    safety:
      "Keep materials away from electrical equipment and clean up paper scraps after the activity.",
    inclusion:
      "Allow participants to work in pairs and give spoken instructions when needed.",
  },
  {
    id: "water-filtration",
    title: "Water Filtration Challenge",
    level: "Grade 7–8",
    durationMinutes: 60,
    topic: "Environmental Science",
    materials: ["Plastic bottle", "Sand", "Gravel", "Water"],
    description: "Build a simple filter using locally available materials.",
    preparation:
      "Cut the bottle in half before the session; rinse the sand and gravel.",
    steps: [
      "Place the cut bottle top upside down in the bottom half.",
      "Add gravel, then sand.",
      "Pour muddy water through slowly.",
      "Compare the water before and after.",
    ],
    safety: "Do not drink the filtered water. Wipe up spills straight away.",
    inclusion:
      "Give each pair a clear role (pourer, observer) and describe the colour of the water aloud.",
  },
  {
    id: "simple-circuits",
    title: "Simple Circuits",
    level: "Grade 7",
    durationMinutes: 45,
    topic: "Physics",
    materials: ["Battery", "Wire", "Small bulb", "Tape"],
    description:
      "Build a simple electrical circuit and see how the parts work together.",
    preparation: "Strip the wire ends and check the bulb before the session.",
    steps: [
      "Tape wire to one end of the battery.",
      "Connect the other end to the bulb.",
      "Complete the loop to light the bulb.",
      "Try a break in the loop and note what happens.",
    ],
    safety: "Use only small batteries. Never connect to mains electricity.",
    inclusion:
      "Provide a large-print diagram and let learners sort the parts by touch.",
  },
  {
    id: "plant-growth",
    title: "Plant Growth Investigation",
    level: "Grade 7–8",
    durationMinutes: 30,
    topic: "Biology",
    materials: ["Seeds", "Small containers", "Water", "Soil"],
    description: "Investigate how different conditions affect plant growth.",
    preparation: "Fill the containers with soil before the session.",
    steps: [
      "Plant the same number of seeds in each container.",
      "Put one container in light and one in shade.",
      "Water them equally.",
      "Record what you expect to see.",
    ],
    safety: "Wash hands after handling soil.",
    inclusion:
      "Offer picture cards for the steps and allow drawing instead of writing.",
  },
]
