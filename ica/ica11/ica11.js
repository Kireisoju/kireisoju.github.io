// Complete variable definitions and random function

const customName = document.getElementById("custom-name");
const generateBtn = document.querySelector(".generate");
const story = document.querySelector(".story");

function randomValueFromArray(array) {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
}

// Solution: Raw text strings

const characters = ["John Pork", "K-Dog", "Jimothy"];
const places = ["the Statue of Liberty", " the Sun", "the toilet"];
const events = [
  "started floating away",
  "freezed into ice cream",
  "turned into a bear and ate some berries",
];

// Solution: Partial return random string function

function returnRandomStoryString() {
  const randomCharacter = randomValueFromArray(characters);
  const randomPlace = randomValueFromArray(places);
  const randomEvent = randomValueFromArray(events);

  let storyText = `It was -2 Fahrenheit outside, so ${randomCharacter} went for a walk. When they got to ${randomPlace}, they stared in horror for a few moments, then ${randomEvent}. Bob saw the whole thing, but was not surprised — ${randomCharacter} weighs 300 kilos, and it was a windy day.`;

  return storyText;
}

// Solution: Event listener and partial generate function definition

generateBtn.addEventListener("click", generateStory);

function generateStory() {
  let newStory = returnRandomStoryString();

  if (customName.value !== "") {
    const name = customName.value;
    newStory = newStory.replace("Bob", name);
  }

  if (document.getElementById("uk").checked) {
    const weight = `${Math.round(300 / 14)} stone`;
    const temperature = `${Math.round((94 - 32) * (5 / 9))} Celsius`;
    newStory = newStory.replace("300 kilos", weight);
    newStory = newStory.replace("-2 Fahrenheit", temperature);
  }

  story.textContent = newStory;
  story.style.visibility = "visible";
}