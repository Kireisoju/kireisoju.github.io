let newBtn = document.querySelector('#js-new-quote')
newBtn.addEventListener('click', getQuote);

const endpoint = "https://trivia.cyberwisp.com/getrandomchristmasquestion";
let current = {
    question: "",
    answer: ""
}

const answerText = document.querySelector('#js-answer-text');

let answerBtn = document.querySelector('#js-tweet').addEventListener('click', showAnswer);

async function getQuote(){
   // alert("this Works!");
    try{
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw Error(response.statusText);
        }
        const json = await response.json();
        console.log(json);
        displayQuote(json['question']);
        current.question = json["question"];
        current.answer = json["answer"];
    }catch(err){
        console.log(err)
        alert('Failed to catch input');
    }
}

function displayQuote(quote){
    const quoteText = document.querySelector('#js-quote-text');
    quoteText.textContent = quote;
    answerText.textContent = "";
}

function showAnswer(){
    answerText.textContent = current.answer;
}

getQuote();