(() => {


// Constants
let BACKEND_BASE_URL;
const ortam = "prod";

if (ortam == "dev") {
  BACKEND_BASE_URL = "http://localhost:5000/api";
} else if (ortam == "prod") {
  BACKEND_BASE_URL = "https://sahibinden-backend-production.up.railway.app/api";
}

const EVALUATE_BUTTON_ID = 'evaluateCarButton';
const EVALUATION_TABLE_ID = 'evaluationResultTable';
const STYLE_ID = 'customStylesdetail';
const NOTIFICATION_DURATION = 3000;
const URL_CHECK_INTERVAL = 1000;

// Variables
let chatHistory = [];
let isAIActive = false; // Backend'den alınacak değer

// Initialize the script
init();

function init() {
  injectStyles(); // Stil dosyalarını her sayfada yükle
  monitorUrlChanges();
  processCurrentPage();
}

// Monitor URL changes to handle SPA navigation
function monitorUrlChanges() {

  
  let lastUrl = location.href;
  setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      processCurrentPage();
    }
  }, URL_CHECK_INTERVAL);
}

// Determine which page we're on and act accordingly
async function processCurrentPage() {

  
  if (isCarDetailPage()) {
  
    
    await checkAIStatus(); // isAIActive değerini al
 
    
    if (isAIActive) {
      injectEvaluateButton();
      injectChatbot();
    } else {
      removeInjectedElements();
    }
  } else {
    removeInjectedElements();
  }
}

// Check if the current page is a car detail page
function isCarDetailPage() {
  return (
    window.location.href.includes("/ilan/vasita") &&
    (document.querySelector(".classifiedUserBox") ||
      document.querySelector(".user-info-module"))
  );
}

  // Check if the current page is a listing page
  function isListingPage() {
    return document.querySelector("#searchResultsTable") && (window.location.pathname.startsWith('/otomobil') || window.location.pathname.startsWith('/arazi-suv')) && document.querySelector("#searchResultsTable thead tr").innerText.includes('Marka') && document.querySelector("#searchResultsTable thead tr").innerText.includes('Seri') && document.querySelector("#searchResultsTable thead tr").innerText.includes('Model');
  }

// Remove injected elements when navigating away
function removeInjectedElements() {
  removeElementById(EVALUATE_BUTTON_ID);
  removeElementById(EVALUATION_TABLE_ID);
  removeElementById('chatbotIcon');
  removeElementById('chatbotWindow');
}

// Remove an element by its ID
function removeElementById(elementId) {
  const element = document.getElementById(elementId);
  if (element) element.remove();
}

// Inject styles into the page
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const styles = `
    /* Stil kodları buraya gelecek (cardetail.js için gerekli olanlar) */
    .evaluate-btn {
      padding: 10px 20px;
      background-color: #ffe800;
      color: #000;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-bottom: 12px;
    }
    .evaluate-btn:disabled {
      background-color: #999;
      cursor: not-allowed;
    }
    #${EVALUATION_TABLE_ID} {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    #${EVALUATION_TABLE_ID} th,
    #${EVALUATION_TABLE_ID} td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
      font-size: 14px;
    }
    #${EVALUATION_TABLE_ID} th {
      background-color: #f2f2f2;
    }
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      color: #fff;
      padding: 15px;
      z-index: 9999;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      max-width:300px;
    }
    .notification-success {
      background-color: #4caf50;
    }
    .notification-error {
      background-color: #f44336;
    }
    .notification-info {
      background-color: #2196f3;
    }
    #chatbotIcon {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background-color: #ffe800;
      color: #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 30px;
      z-index: 10000;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }
    #chatbotWindow {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 390px;
      max-height: 600px;
      min-height: 400px;
      background-color: #fff;
      border: 1px solid #000;
      border-radius: 10px;
      display: none;
      flex-direction: column;
      z-index: 10000;
    }
    #chatbotHeader {
      background-color: #ffe800;
      color: #000;
      padding: 10px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #chatbotHeader h2 {
      margin: 0;
      font-size: 16px;
    }
    #chatbotContent {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    #chatbotInputContainer {
      display: flex;
      border-top: 1px solid #ccc;
    }
    #chatbotInput {
      flex: 1;
      padding: 12px;
      border: none;
      outline: none;
      border-radius: 0 0 0 10px;
    }
    #chatbotSendButton {
      padding: 10px;
      background-color: #ffe800;
      color: #000;
      border: none;
      cursor: pointer;
      font-weight: 600;
      border-radius: 0 0 10px 0;
      font-size: 13px;
    }
    .chatbot-message {
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 10px;
      max-width: 80%;
      word-wrap: break-word;
      font-size: 13px;
    }
    .chatbot-message.user {
      background-color: #ffe800;
      align-self: flex-end;
    }
    .chatbot-message.bot {
      background-color: #f2f2f2;
      align-self: flex-start;
    }
    /* Predefined questions styles */
    #predefinedQuestions {
      display: flex;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .question-button {
      background-color: #e0e0e0;
      border: none;
      padding: 8px 12px;
      margin: 5px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
    }
    .question-button:hover {
      background-color: #d5d5d5;
    }
  `;
  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}



// ----------------Detail page-----------------


// Check AI status from the backend
async function checkAIStatus() {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/config/ai-status`);
    const data = await response.json();
    if (response.ok) {
      isAIActive = data.isAIActive;
    } else {
      console.error('AI status could not be retrieved.');
      isAIActive = false;
    }
  } catch (error) {
    console.error('checkAIStatus error:', error);
    isAIActive = false;
  }
}

// Inject the "Evaluate Car" button on the car detail page
function injectEvaluateButton() {
  if (document.getElementById(EVALUATE_BUTTON_ID)) return;

  const evaluateButton = createEvaluateButton();

  const buttonContainer = document.createElement('div');
  buttonContainer.appendChild(evaluateButton);

  const targetElement =
    document.querySelector('.classifiedUserBox') || document.querySelector('.user-info-module');

  if (targetElement) {
    targetElement.insertAdjacentElement('afterend', buttonContainer);
    evaluateButton.addEventListener('click', evaluateCar);
  }
}

// Create the "Evaluate Car" button element
function createEvaluateButton() {
  const button = document.createElement('div');
  button.className = 'evaluate-btn';
  button.id = EVALUATE_BUTTON_ID;
  button.textContent = 'Aracı Değerlendir';
  return button;
}

// Function to generate or retrieve the user's UUID
function getUserUUID() {
  let uuid = localStorage.getItem('userUUID');
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem('userUUID', uuid);
  }
  return uuid;
}

// Function to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
 // Fetch and evaluate car data
 async function evaluateCar() {
  const evaluateButton = document.getElementById(EVALUATE_BUTTON_ID);
  if (!evaluateButton) return;
  if (evaluateButton.innerText !== 'Aracı Değerlendir') return;

  // Disable the button and change its text
  evaluateButton.disabled = true;
  const originalButtonText = evaluateButton.textContent;
  evaluateButton.textContent = 'Araç Değerlendiriliyor...';

  try {
    const carData = extractCarDetailData();
    if (!carData) {
      showNotification('Araç bilgileri alınamadı.');
      evaluateButton.disabled = false;
      evaluateButton.textContent = originalButtonText;
      return;
    }

    // Get the user's UUID and add it to carData as 'ip'
    const userUUID = getUserUUID();
    carData.ip = userUUID;

    const response = await fetch(`${BACKEND_BASE_URL}/cars/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carData),
    });
    const data = await response.json();

    if (response.ok) {
      displayEvaluationResult(data, carData);
    } else {
      showNotification(`Değerlendirme yapılamadı: ${data.message}`);
    }
  } catch (error) {
    console.error('evaluateCar error:', error);
    showNotification('Değerlendirme yapılamadı.');
  } finally {
    // Re-enable the button and restore original text
    evaluateButton.disabled = false;
    evaluateButton.textContent = originalButtonText;
  }
}

// Display the evaluation result in a table below the button
function displayEvaluationResult(data, carData) {
  removeElementById(EVALUATION_TABLE_ID);

  const resultTable = document.createElement('table');
  resultTable.id = EVALUATION_TABLE_ID;

  // Format average price
  const averagePriceNumber = Number(data.averagePrice) || 0;
  const formattedAveragePrice = averagePriceNumber.toLocaleString('tr-TR') + ' TL';

  // Get current car price as number
  const carPrice = parseInt(carData.fiyat.replace(/\D/g, '')) || 0;

  // Calculate price difference percentage
  let priceDifferencePercentage = 0;
  let priceComparisonText = '';

  if (averagePriceNumber > 0) {
    priceDifferencePercentage = ((carPrice - averagePriceNumber) / averagePriceNumber) * 100;

    if (priceDifferencePercentage < 0) {
      priceComparisonText = `%${Math.abs(priceDifferencePercentage.toFixed(2))} daha ucuz`;
    } else if (priceDifferencePercentage > 0) {
      priceComparisonText = `%${priceDifferencePercentage.toFixed(2)} daha pahalı`;
    } else {
      priceComparisonText = `Fiyat ortalama ile aynı`;
    }
  } else {
    priceComparisonText = 'Ortalama fiyat bulunamadı, karşılaştırma yapılamıyor.';
  }

  const tableRows = [
    createTableRow(
      `<strong>Marka / Seri / Model / Yıl:</strong> ${carData.Marka || ''} / ${carData.Seri || ''} / ${carData.Model || ''}/ ${carData.Yıl || ''}`
    ),
    createTableRow(`<strong>Benzer Araç Sayısı:</strong> ${data.similarCount || 0}`),
    createTableRow(`<strong>Ortalama Fiyat:</strong> ${formattedAveragePrice}`),
    createTableRow(`<strong>Bu araç ortalama fiyattan:</strong> ${priceComparisonText}`),
    createTableRow(`<strong>Değerlendirme:</strong><br>${data.evaluation}`),
  ];

  // Add remaining usage count if available

 if (data.remainingEvaluations !== undefined && data.remainingEvaluations !== null) {
  tableRows.push(
    createTableRow(`<strong>Kalan kullanım hakkı:</strong> ${data.remainingEvaluations}`)
  );
}

  tableRows.forEach((row) => resultTable.appendChild(row));

  const evaluateButton = document.getElementById(EVALUATE_BUTTON_ID);
  if (evaluateButton) {
    evaluateButton.insertAdjacentElement('afterend', resultTable);
  }
}

// Create a table row with given HTML content
function createTableRow(htmlContent) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 2;
  cell.innerHTML = htmlContent;
  row.appendChild(cell);
  return row;
}

// Show a notification message
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, NOTIFICATION_DURATION);
}

// Inject the chatbot icon and window
function injectChatbot() {
  injectChatbotIcon();
  createChatbotWindow();
  loadChatHistory();
}

function injectChatbotIcon() {
  if (document.getElementById("chatbotIcon")) return;

  const icon = document.createElement("div");
  icon.id = "chatbotIcon";
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="35px" height="27px" viewBox="0 0 206.000000 167.000000" preserveAspectRatio="xMidYMid meet">
<metadata>
Created by potrace 1.10, written by Peter Selinger 2001-2011
</metadata>
<g transform="translate(0.000000,167.000000) scale(0.050000,-0.050000)" fill="#000000" stroke="none">
<path d="M2301 2958 c-289 -56 -520 -289 -581 -585 -115 -559 484 -1030 1003 -789 l113 52 63 -65 c51 -53 61 -75 50 -120 -13 -50 18 -86 386 -455 l400 -401 102 -10 c96 -9 106 -6 173 61 161 161 102 262 -487 842 -220 215 -247 236 -300 226 -46 -10 -69 0 -120 53 l-62 64 52 129 c214 529 -244 1106 -792 998z m375 -158 c373 -161 475 -666 196 -975 -223 -247 -662 -246 -886 2 -441 488 86 1233 690 973z"></path>
<path d="M2492 2663 c-7 -11 -22 -135 -33 -275 -23 -282 -30 -309 -50 -195 -28 153 -99 199 -147 93 l-25 -54 -44 79 c-42 76 -48 79 -159 85 -150 8 -179 -69 -29 -80 80 -6 88 -12 141 -111 61 -114 95 -129 141 -63 34 48 41 29 94 -215 23 -111 71 -153 111 -97 13 18 30 153 38 311 14 271 31 336 59 224 24 -94 46 -105 203 -105 135 0 148 4 148 40 0 36 -13 40 -120 40 -135 0 -117 -18 -204 210 -43 112 -95 160 -124 113z"></path>
<path d="M1038 2390 c-47 -25 -378 -561 -378 -612 0 -10 241 -18 572 -18 514 0 571 3 560 32 -7 17 -12 35 -12 40 0 4 -211 8 -470 8 -258 0 -470 7 -470 16 0 8 57 114 127 235 151 261 164 269 471 266 172 -2 211 3 226 30 25 46 -544 48 -626 3z"></path>
<path d="M133 1903 c-87 -96 -16 -223 124 -223 73 0 87 -7 105 -55 l21 -55 79 88 c89 99 101 179 38 242 -56 56 -317 59 -367 3z"></path>
<path d="M3273 1903 c-36 -39 -45 -123 -14 -123 11 0 49 -26 85 -57 159 -138 419 10 305 173 -43 61 -323 66 -376 7z"></path>
<path d="M623 1703 c4 -9 95 -94 203 -190 l196 -173 860 0 860 0 79 63 c150 121 83 187 -117 116 -261 -92 -518 -54 -744 113 l-120 88 -612 0 c-336 0 -608 -7 -605 -17z"></path>
<path d="M460 1577 c-125 -145 -138 -172 -140 -297 -1 -77 -12 -125 -40 -160 -36 -46 -39 -84 -40 -472 0 -522 -14 -498 284 -498 239 0 276 26 276 190 0 107 15 120 140 120 69 0 87 13 200 140 l124 140 624 0 624 0 117 -135 c111 -128 121 -136 219 -145 l102 -10 12 -100 c22 -191 66 -218 329 -207 240 10 249 22 249 344 l0 242 -154 155 -153 154 -66 -68 c-103 -106 -370 -130 -384 -34 -9 63 151 224 223 224 82 0 77 24 -25 131 l-96 101 -63 -56 -63 -56 -875 0 -876 0 -225 200 c-266 236 -215 221 -323 97z m250 -400 c184 -64 276 -146 266 -234 -10 -91 -244 -84 -357 11 -111 93 -196 335 -104 295 19 -8 107 -41 195 -72z m2010 29 c0 -7 -56 -88 -125 -179 l-125 -165 -581 -1 -581 -1 -134 170 c-74 94 -134 175 -134 180 0 6 378 10 840 10 462 0 840 -6 840 -14z m-2116 -450 c-59 -59 6 -156 104 -157 59 0 60 -2 23 -30 -49 -37 -98 -37 -172 2 -75 38 -82 130 -15 178 53 37 95 42 60 7z m2669 -70 c24 -97 -111 -171 -225 -123 l-58 25 60 8 c87 11 136 61 122 128 -14 73 82 36 101 -38z"></path>
<path d="M1160 1148 c0 -7 37 -59 82 -115 l82 -103 549 -10 549 -10 46 50 c25 28 71 84 101 125 l56 75 -733 0 c-402 0 -732 -5 -732 -12z"></path>
<path d="M1218 605 c-150 -160 -220 -145 671 -145 l793 0 -95 110 -95 110 -602 0 -602 0 -70 -75z"></path>
</g>
</svg>`; // İkon olarak bir SVG kullanıyoruz
  document.body.appendChild(icon);

  icon.addEventListener("click", toggleChatbot);
}

function toggleChatbot() {
  const chatbotWindow = document.getElementById("chatbotWindow");
  if (chatbotWindow.style.display === "none") {
    chatbotWindow.style.display = "flex";
  } else {
    chatbotWindow.style.display = "none";
  }
}

function createChatbotWindow() {
  if (document.getElementById("chatbotWindow")) return;

  const chatbotWindow = document.createElement("div");
  chatbotWindow.id = "chatbotWindow";
  chatbotWindow.style.display = "none";

  // Chat header
  const header = document.createElement("div");
  header.id = "chatbotHeader";

  const headerTitle = document.createElement("h2");
  headerTitle.innerText = "Akıllı Eksper";
  header.appendChild(headerTitle);

  // Chat content
  const chatContent = document.createElement("div");
  chatContent.id = "chatbotContent";

  // Welcome message
  const welcomeMessage = document.createElement("div");
  welcomeMessage.className = "chatbot-message bot";
  welcomeMessage.innerText = "Hoşgeldiniz, size nasıl yardımcı olabilirim?";
  chatContent.appendChild(welcomeMessage);

  // Predefined questions
  const predefinedQuestions = [
    "Bu aracın piyasa ortalaması kaç liradır?",
    "Bu aracın artıları nelerdir?",
    "Bu aracın yakıt tüketimi nasıldır?",
    "Bu aracın kronik sorunları var mıdır?"
  ];

  const questionsContainer = document.createElement("div");
  questionsContainer.id = "predefinedQuestions";

  predefinedQuestions.forEach((question) => {
    const questionButton = document.createElement("button");
    questionButton.className = "question-button";
    questionButton.innerText = question;
    questionButton.addEventListener("click", () => {
      handlePredefinedQuestion(question);
    });
    questionsContainer.appendChild(questionButton);
  });

  chatContent.appendChild(questionsContainer);

  // Input container
  const inputContainer = document.createElement("div");
  inputContainer.id = "chatbotInputContainer";

  const inputField = document.createElement("input");
  inputField.id = "chatbotInput";
  inputField.type = "text";
  inputField.placeholder = "Mesajınızı yazın...";

  const sendButton = document.createElement("button");
  sendButton.id = "chatbotSendButton";
  sendButton.innerText = "Gönder";
  sendButton.addEventListener("click", sendMessage);

  inputContainer.appendChild(inputField);
  inputContainer.appendChild(sendButton);

  chatbotWindow.appendChild(header);
  chatbotWindow.appendChild(chatContent);
  chatbotWindow.appendChild(inputContainer);

  document.body.appendChild(chatbotWindow);
}

function handlePredefinedQuestion(question) {
  // Append the user's question to the chat
  appendMessage("user", question);

  // Process the question
  if (question === "Bu aracın piyasa ortalaması kaç liradır?") {
    // Call a function to get the average price
    getAveragePrice();
  } else {
    // For other questions, handle as normal messages
    handleUserMessage(question);
  }
}

async function getAveragePrice() {
  // Add 'Yazıyor...' message
  appendMessage("bot", "Yazıyor...");
  const chatContent = document.getElementById("chatbotContent");
  const typingMessage = chatContent.lastChild;

  // Start typing animation
  let dotCount = 1;
  const maxDots = 3;
  const typingAnimationInterval = setInterval(() => {
    typingMessage.innerText = "Yazıyor" + ".".repeat(dotCount);
    dotCount = (dotCount % maxDots) + 1;
  }, 500);

  // Extract car data
  const carData = extractCarDetailData();
  if (!carData) {
    clearInterval(typingAnimationInterval);
    typingMessage.remove();
    appendMessage("bot", "Araç bilgileri alınamadı.");
    return;
  }

  // Get the user's UUID
  const userUUID = getUserUUID();

  // Prepare request data
  const requestData = {
    ...carData,
    ip: userUUID,
  };

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/cars/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    const data = await response.json();

    clearInterval(typingAnimationInterval);
    typingMessage.remove();

    if (response.ok) {
      const averagePrice = Number(data.averagePrice) || 0;
      const formattedAveragePrice = averagePrice.toLocaleString('tr-TR') + ' TL';
      const similarCount = data.similarCount || 0;

      let reply = `Bu araç ile benzer ${similarCount} araç bulunmaktadır. Benzer araçların ortalama fiyatı ${formattedAveragePrice}'dir.`;

      appendMessage("bot", reply);

      // Show remaining usage if available
      if (data.remainingEvaluations !== undefined && data.remainingEvaluations !== null) {
        appendMessage("bot", `Kalan kullanım hakkı: ${data.remainingEvaluations}`);
      }
    } else {
      appendMessage("bot", `Hata: ${data.message}`);
    }
  } catch (error) {
    console.error("getAveragePrice error:", error);
    clearInterval(typingAnimationInterval);
    typingMessage.remove();
    appendMessage(
      "bot",
      "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    );
  }
}

function sendMessage() {
  const inputField = document.getElementById("chatbotInput");
  const message = inputField.value.trim();
  if (!message) return;

  // Kullanıcı mesajını sohbet penceresine ekleyelim
  appendMessage("user", message);

  // Mesaj alanını temizle
  inputField.value = "";

  // Mesajı işleyelim
  handleUserMessage(message);
}

function appendMessage(sender, text) {
  const chatContent = document.getElementById("chatbotContent");
  const messageDiv = document.createElement("div");
  messageDiv.className = `chatbot-message ${sender}`;
  messageDiv.innerText = text;
  chatContent.appendChild(messageDiv);

  // Sohbet içeriğini en alta kaydır
  chatContent.scrollTop = chatContent.scrollHeight;

  // Mesajı sohbet geçmişine ekle
  chatHistory.push({ sender, text });
  saveChatHistory();
}

function saveChatHistory() {
  sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

async function loadChatHistory() {
  const savedHistory = sessionStorage.getItem("chatHistory");
  if (savedHistory) {
    chatHistory = await JSON.parse(savedHistory);

    chatHistory.forEach((msg) => {
      if (msg.text != "Yazıyor...") {
        const chatContent = document.getElementById("chatbotContent");
        const messageDiv = document.createElement("div");
        messageDiv.className = `chatbot-message ${msg.sender}`;
        messageDiv.innerText = msg.text;
        chatContent.appendChild(messageDiv);
      }
    });
    // Sohbet içeriğini en alta kaydır
    const chatContent = document.getElementById("chatbotContent");
    chatContent.scrollTop = chatContent.scrollHeight;
  }
}

async function handleUserMessage(message) {
  // Add 'Yazıyor...' message
  appendMessage("bot", "Yazıyor...");
  const chatContent = document.getElementById("chatbotContent");
  const typingMessage = chatContent.lastChild;

  // Start typing animation
  let dotCount = 1;
  const maxDots = 3;
  const typingAnimationInterval = setInterval(() => {
    typingMessage.innerText = "Yazıyor" + ".".repeat(dotCount);
    dotCount = (dotCount % maxDots) + 1;
  }, 500);

  // Extract car data
  const carData = extractCarDetailData();
  if (!carData) {
    clearInterval(typingAnimationInterval);
    typingMessage.remove();
    appendMessage("bot", "Araç bilgileri alınamadı.");
    return;
  }

  // Get the user's UUID
  const userUUID = getUserUUID();

  // Prepare request data
  const requestData = {
    message,
    carData,
    ip: userUUID,
  };

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/cars/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    const data = await response.json();

    clearInterval(typingAnimationInterval);
    typingMessage.remove();

    if (response.ok) {
      appendMessage("bot", data.reply);

      // Show remaining usage if available
      if (data.remainingEvaluations !== undefined && data.remainingEvaluations !== null) {
        appendMessage("bot", `Kalan kullanım hakkı: ${data.remainingEvaluations}`);
      }
    } else {
      appendMessage("bot", `Hata: ${data.message}`);
    }
  } catch (error) {
    console.error("handleUserMessage error:", error);
    clearInterval(typingAnimationInterval);
    typingMessage.remove();
    appendMessage(
      "bot",
      "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    );
  }
}

// Extract car data from the detail page
function extractCarDetailData() {
  try {
    const carData = {};
    const classifiedInfoElement = document.querySelector(
      ".classifiedInfoList"
    );
    if (!classifiedInfoElement) return null;

    Object.assign(
      carData,
      parseClassifiedInfo(classifiedInfoElement.innerText)
    );

    const detailElement = document.querySelector(".classifiedDescription");
    if (detailElement?.innerHTML) {
      carData.detail = parseDetailSections(detailElement.innerHTML);
    }

    const techDetailsElement = document.querySelector(
      ".classifiedTechDetails"
    );
    if (techDetailsElement?.innerHTML) {
      carData.techDetails = parseTechDetails(techDetailsElement.innerHTML);
    }

    if (
      document.querySelector("#classifiedDescription") &&
      document.querySelector("#classifiedDescription").innerText.length > 0
    ) {
      carData.detailText = document
        .querySelector("#classifiedDescription")
        .innerText.replaceAll("\n", "-");
    }

    const priceElement = document.querySelector(".classified-price-wrapper");
    if (priceElement) {
      carData.fiyat = priceElement.innerText.trim();
    }

    console.log("Extracted car data:", carData);
    return carData;
  } catch (error) {
    console.error("extractCarDetailData error:", error);
    return null;
  }
}

// Parse classified information text into an object
function parseClassifiedInfo(text) {
  const data = {};
  let key = null;
  text.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !key) {
      key = trimmedLine;
    } else if (trimmedLine && key) {
      data[key.replace(/\s+/g, "")] = trimmedLine;
      key = null;
    }
  });
  return data;
}

// Parse detail sections from HTML
function parseDetailSections(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const sections = {};

  doc.querySelectorAll("h3").forEach((h3) => {
    const sectionTitle = h3.textContent.trim();
    const ulElement =
      h3.nextElementSibling?.tagName === "UL" ? h3.nextElementSibling : null;
    if (ulElement) {
      const items = Array.from(ulElement.querySelectorAll("li")).map((li) => ({
        name: li.textContent.trim(),
        selected: li.classList.contains("selected"),
      }));
      sections[sectionTitle] = items;
    }
  });
  return sections;
}

// Parse technical details from HTML
function parseTechDetails(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const techDetails = {};

  doc.querySelectorAll("h3").forEach((h3) => {
    const sectionTitle = h3.textContent.trim();
    const tableElement =
      h3.nextElementSibling?.tagName === "TABLE"
        ? h3.nextElementSibling
        : null;
    if (tableElement) {
      const specs = {};
      tableElement.querySelectorAll("tr").forEach((row) => {
        const key = row
          .querySelector("td.title")
          ?.textContent.trim()
          .replace(/\s+/g, " ");
        const value = row
          .querySelector("td.value")
          ?.textContent.trim()
          .replace(/\s+/g, " ");
        if (key && value) {
          specs[key] = value;
        }
      });
      techDetails[sectionTitle] = specs;
    }
  });
  return techDetails;
}

// ----------------Detail page-----------------
})();
