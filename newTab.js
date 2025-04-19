document.addEventListener("DOMContentLoaded", () => {
  const backgroundContainer = document.createElement("div");
  backgroundContainer.className = "background-container";
  document.body.appendChild(backgroundContainer);

  const categoriesContainer = document.getElementById("categories-container");
  const tasksContainer = document.getElementById("tasks-container");
  const taskList = document.getElementById("task-list");
  const resetButton = document.getElementById("reset-button");
  const resetModal = document.getElementById("reset-modal");
  const resetYesButton = document.getElementById("reset-yes");
  const resetNoButton = document.getElementById("reset-no");

  // for controlling when hovers are active
  let hoverListeners = [];
  
  // Track whether a mood has been selected
  let moodSelected = false;

  // Deer character definitions - each deer has a unique personality
  const deerCharacters = {
    deer1: {
      name: "Luna",
      description: "A nurturing and patient deer who specializes in self-care routines.",
      personality: "Luna is gentle, empathetic, and focused on helping you find calm in everyday routines. She offers practical self-care advice and believes in celebrating small victories.",
      category: "daily",
      systemPrompt: `
  # Identity
  You are Luna, a nurturing and patient deer focused on self-care.
  
  # Instructions
  * Speak in a calm, soothing voice.
  * Keep your responses short, gentle, and encouraging.
  * Offer small, practical self‑care ideas (e.g., breathing exercises, micro‑breaks).
  * Never use technical jargon—use everyday language.
  
  # Signature
  Always end with "~ Luna 🌙".
  `.trim()
    },
  
    deer2: {
      name: "Oliver",
      description: "A social, cheerful deer who values connection and relationships.",
      personality: "Oliver is outgoing, warm, and loves to help you strengthen your connections with loved ones. He's optimistic and believes relationships are key to happiness.",
      category: "friends",
      systemPrompt: `
  # Identity
  You are Oliver, a social and cheerful deer who values relationships.
  
  # Instructions
  * Speak with enthusiasm and warmth.
  * Keep responses brief, upbeat, and encouraging.
  * Suggest concrete ways to nurture bonds (e.g., plan a coffee date, send a thoughtful note).
  * Avoid negativity; focus on positive reinforcement.
  
  # Signature
  Always end with "~ Oliver 🌟".
  `.trim()
    },
  
    deer3: {
      name: "Hazel",
      description: "A gentle deer with a special connection to animals and pets.",
      personality: "Hazel is calm, intuitive, and has a deep understanding of the bond between humans and animals. She's patient and believes pets bring immense joy and healing.",
      category: "pet",
      systemPrompt: `
  # Identity
  You are Hazel, a gentle deer with a special connection to animals.
  
  # Instructions
  * Speak softly and intuitively.
  * Keep responses concise and practical.
  * Offer clear, actionable pet‑care tips (e.g., feeding schedules, bonding games).
  * Use empathetic language to validate pet owners’ feelings.
  
  # Signature
  Always end with "~ Hazel 🐾".
  `.trim()
    },
  
    deer4: {
      name: "Atlas",
      description: "A practical, organized deer who helps create harmonious living spaces.",
      personality: "Atlas is methodical, detail-oriented, and believes your environment affects your wellbeing. He's resourceful and finds joy in creating functional, beautiful spaces.",
      category: "home",
      systemPrompt: `
  # Identity
  You are Atlas, a practical and organized deer who helps with home spaces.
  
  # Instructions
  * Speak clearly and systematically.
  * Keep responses concise and practical.
  * Provide step‑by‑step suggestions for home improvement or organization.
  * Reference simple tools or materials when relevant.
  
  # Signature
  Always end with "~ Atlas 🏡".
  `.trim()
    },
  
    deer5: {
      name: "Willow",
      description: "A thoughtful, introspective deer who guides mental wellness practices.",
      personality: "Willow is reflective, wise, and attuned to emotions. She's gentle but profound, believing in the power of mindfulness and emotional awareness.",
      category: "mind",
      systemPrompt: `
  # Identity
  You are Willow, a thoughtful and introspective deer who guides mental wellness.
  
  # Instructions
  * Speak thoughtfully and calmly.
  * Keep responses brief, insightful, and calming.
  * Offer gentle mindfulness or emotional‑awareness exercises.
  * Validate the user’s feelings and encourage self‑compassion.
  
  # Signature
  Always end with "~ Willow 🍃".
  `.trim()
    },
  
    deer6: {
      name: "Nova",
      description: "A creative, adaptable deer who helps with unique personal goals.",
      personality: "Nova is innovative, versatile, and enthusiastic about exploring new ideas. She's supportive and believes in the power of pursuing your unique interests.",
      category: "others",
      systemPrompt: `
  # Identity
  You are Nova, a creative and adaptable deer who helps with unique goals.
  
  # Instructions
  * Speak with energy and curiosity.
  * Keep responses short, supportive, and idea‑driven.
  * Encourage exploration of new projects or hobbies.
  * Ask follow‑up questions to spark creativity.
  
  # Signature
  Always end with "~ Nova ✨".
  `.trim()
    }
  };
  

  // Chat module - Handles all chat-related functionality
  const ChatModule = (function() {
    // Private variables
    let chatHistory = {};
    let currentDeer = null;
    let apiKey = null;
    
    // Initialize the module
    function init() {
      // Load chat history from storage
      chrome.storage.local.get("chatHistory", (data) => {
        if (data.chatHistory) {
          chatHistory = data.chatHistory;
        }
      });
      
      // Load API key if it exists
      chrome.storage.local.get("openai_api_key", (data) => {
        if (data.openai_api_key) {
          apiKey = data.openai_api_key;
        }
      });
    }
    
    // Save chat history to storage
    function saveChatHistory() {
      chrome.storage.local.set({ chatHistory });
    }
    
    // Set the OpenAI API key
    function setApiKey(key) {
      apiKey = key;
      chrome.storage.local.set({ openai_api_key: key });
      
      // Dispatch an event to notify that the API key has changed
      document.dispatchEvent(new CustomEvent('apiKeyChanged'));
      
      return !!key; // Return true if key is set
    }
    
    // Check if API key is set
    function hasApiKey() {
      return !!apiKey;
    }
    
    // Start a chat with a specific deer
    function startChat(deerId) {
      currentDeer = deerId;
      if (!chatHistory[deerId]) {
        chatHistory[deerId] = [];
      }
      return deerCharacters[deerId];
    }
    
    // Get chat history for the current deer
    function getChatHistory() {
      return currentDeer ? chatHistory[currentDeer] : [];
    }
    
    // Add a message to the chat history
    function addMessage(message, isUser = true) {
      if (!currentDeer) return false;
      
      chatHistory[currentDeer].push({
        content: message,
        isUser,
        timestamp: Date.now()
      });
      
      saveChatHistory();
      return true;
    }
    
    // Clear chat history for a deer
    function clearChat(deerId) {
      if (deerId && chatHistory[deerId]) {
        chatHistory[deerId] = [];
        saveChatHistory();
        return true;
      }
      return false;
    }
    
    // Send a message to the OpenAI API and get a response
    async function sendMessage(message) {
      if (!currentDeer || !apiKey) return null;
      
      // Add user message to history
      addMessage(message, true);
      
      // Prepare messages for OpenAI API
      const messages = [
        { role: "system", content: deerCharacters[currentDeer].systemPrompt },
        // Convert chat history to OpenAI format, limiting to last 10 messages
        ...chatHistory[currentDeer].slice(-10).map(msg => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content
        }))
      ];
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 150,
            temperature: 0.7
          })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
          const reply = data.choices[0].message.content.trim();
          addMessage(reply, false);
          return reply;
        } else {
          console.error('OpenAI API error:', data);
          return null;
        }
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return null;
      }
    }
    
    // Clear all chat data
    function clearAllData() {
      chatHistory = {};
      currentDeer = null;
      saveChatHistory();
    }
    
    // Clear the API key
    function clearApiKey() {
      apiKey = null;
      chrome.storage.local.remove("openai_api_key", () => {
        console.log("API key deleted");
        
        // Dispatch an event to notify that the API key has changed
        document.dispatchEvent(new CustomEvent('apiKeyChanged'));
      });
      return true;
    }
    
    // Public API
    return {
      init,
      saveChatHistory,
      setApiKey,
      hasApiKey,
      startChat,
      getChatHistory,
      sendMessage,
      clearChat,
      clearAllData,
      clearApiKey
    };
  })();
  
  // Initialize the chat module
  ChatModule.init();

  // UI Module - Handles all deer info and chat UI components
  const UIModule = (function() {
    // Create deer info display elements
    function createDeerInfoElements() {
      // Create info element for each deer
      deerAreas.forEach((area) => {
        // Get character info
        const character = deerCharacters[area.id];
        if (!character) return;
        
        // Create info container
        const infoEl = document.createElement('div');
        infoEl.className = 'deer-info';
        infoEl.id = `${area.id}-info`;
        
        // Add content
        infoEl.innerHTML = `
          <h3 class="deer-name">${character.name}</h3>
          <p class="deer-description">${character.description}</p>
          <button class="chat-button">
            <span class="typewriter"> talk to ${character.name}</span>
            <span class="thinking-dots">
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
            </span>
          </button>
          <p class="deer-name">
          Why talk to ${character.name}?
          <br>
          <p class="deer-description">${character.personality}</p>
          </p>
        `;
        
        // Position the info element near the deer in this category's scene
        infoEl.style.left = `${area.left + area.width / 2 - 125}px`; // Center horizontally
        infoEl.style.top = `${area.top - 150}px`; // Position above deer
        
        // Add click handler for chat button
        const chatButton = infoEl.querySelector('.chat-button');
        chatButton.addEventListener('click', (e) => {
          e.stopPropagation();
          openChatModal(area.id);
        });
        
        // Add to document
        document.body.appendChild(infoEl);
      });
    }
    
    // Create chat modal
    function createChatModal() {
      const modal = document.createElement('div');
      modal.className = 'chat-modal';
      modal.id = 'chat-modal';
      
      modal.innerHTML = `
        <div class="chat-backdrop"></div>
        <div class="chat-container">
          <div class="chat-header">
            <div class="chat-title">
              <div class="chat-deer-icon">🦌</div>
              <div class="chat-deer-name">Deer</div>
            </div>
            <button class="chat-close">&times;</button>
          </div>
          <div class="chat-messages" id="chat-messages"></div>
          <div class="chat-input-container">
            <input type="text" class="chat-input" placeholder="Type your message..." />
            <button class="chat-send">→</button>
          </div>
        </div>
      `;
      
      // Add event listeners
      const backdrop = modal.querySelector('.chat-backdrop');
      const closeButton = modal.querySelector('.chat-close');
      const chatInput = modal.querySelector('.chat-input');
      const sendButton = modal.querySelector('.chat-send');
      
      backdrop.addEventListener('click', closeChatModal);
      closeButton.addEventListener('click', closeChatModal);
      
      // Send message on Enter key
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChatMessage();
        }
      });
      
      // Send message on button click
      sendButton.addEventListener('click', sendChatMessage);
      
      document.body.appendChild(modal);
    }
    
    // Open chat modal for a specific deer
    function openChatModal(deerId) {
      const modal = document.getElementById('chat-modal');
      if (!modal) {
        createChatModal();
      }
      
      // Update modal with deer info
      const character = ChatModule.startChat(deerId);
      const deerName = document.querySelector('.chat-deer-name');
      deerName.textContent = character.name;
      
      // Clear messages
      const messagesContainer = document.getElementById('chat-messages');
      messagesContainer.innerHTML = '';
      
      // Display welcome message if no chat history
      const chatHistory = ChatModule.getChatHistory();
      if (chatHistory.length === 0) {
        messagesContainer.innerHTML = `
          <div class="chat-welcome">
            <p>Start chatting with ${character.name}!</p>
            <p>${character.personality}</p>
          </div>
        `;
      } else {
        // Display existing chat history
        chatHistory.forEach(message => {
          addMessageToUI(message.content, !message.isUser);
        });
      }
      
      // Show API key input if not set
      if (!ChatModule.hasApiKey()) {
        displayApiKeyInput();
      }
      
      // Show modal
      document.getElementById('chat-modal').classList.add('visible');
      
      // Focus input
      setTimeout(() => {
        document.querySelector('.chat-input').focus();
      }, 300);
    }
    
    // Close chat modal
    function closeChatModal() {
      const modal = document.getElementById('chat-modal');
      if (modal) {
        modal.classList.remove('visible');
      }
    }
    
    // Display API key input form
    function displayApiKeyInput() {
      const messagesContainer = document.getElementById('chat-messages');
      const apiKeyContainer = document.createElement('div');
      apiKeyContainer.className = 'api-key-container';
      apiKeyContainer.innerHTML = `
        <p>Please enter your OpenAI API key to chat:</p>
        <input type="password" class="api-key-input" placeholder="sk-..." />
        <button class="api-key-save">Save Key</button>
        <p class="api-key-message">Your API key is stored locally and only used to communicate with OpenAI.</p>
      `;
      
      // Add event listener to save button
      const saveButton = apiKeyContainer.querySelector('.api-key-save');
      const apiKeyInput = apiKeyContainer.querySelector('.api-key-input');
      
      saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
          if (ChatModule.setApiKey(apiKey)) {
            // Remove API key input
            apiKeyContainer.remove();
            
            // Show welcome message
            const deerName = document.querySelector('.chat-deer-name').textContent;
            messagesContainer.innerHTML = `
              <div class="chat-welcome">
                <p>Start chatting with ${deerName}!</p>
              </div>
            `;
          }
        }
      });
      
      messagesContainer.innerHTML = '';
      messagesContainer.appendChild(apiKeyContainer);
    }
    
    // Send chat message
    async function sendChatMessage() {
      const input = document.querySelector('.chat-input');
      const message = input.value.trim();
      
      if (!message || !ChatModule.hasApiKey()) return;
      
      // Clear input
      input.value = '';
      
      // Add message to UI
      addMessageToUI(message, false);
      
      // Show loading indicator
      const messagesContainer = document.getElementById('chat-messages');
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'chat-loading';
      loadingIndicator.innerHTML = `
        <div class="chat-loading-dots">
          <div class="chat-loading-dot"></div>
          <div class="chat-loading-dot"></div>
          <div class="chat-loading-dot"></div>
        </div>
      `;
      messagesContainer.appendChild(loadingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Send message to API
      const response = await ChatModule.sendMessage(message);
      
      // Remove loading indicator
      loadingIndicator.remove();
      
      // Display response if received
      if (response) {
        addMessageToUI(response, true);
      } else {
        // Display error message if API call failed
        addMessageToUI("I'm sorry, I'm having trouble connecting to my thoughts right now. Please try again later.", true);
      }
    }
    
    // Add message to UI
    function addMessageToUI(content, isDeer) {
      const messagesContainer = document.getElementById('chat-messages');
      const messageEl = document.createElement('div');
      messageEl.className = `chat-message ${isDeer ? 'deer' : 'user'}`;
      messageEl.textContent = content;
      
      // Remove welcome message if present
      const welcomeMessage = messagesContainer.querySelector('.chat-welcome');
      if (welcomeMessage) {
        welcomeMessage.remove();
      }
      
      messagesContainer.appendChild(messageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Update hover behavior to show deer info
    function updateDeerHoverBehavior() {
      deerAreas.forEach((area) => {
        const circle = document.getElementById(`${area.id}-circle`);
        const info = document.getElementById(`${area.id}-info`);
        
        if (!circle || !info) return;
        
        // Update checkHover function to show info on hover
        const existingListeners = hoverListeners.filter(l => l.deerId === area.id);
        if (existingListeners.length > 0) {
          document.removeEventListener('mousemove', existingListeners[0].listener);
          hoverListeners = hoverListeners.filter(l => l.deerId !== area.id);
        }
        
        const checkHover = (e) => {
          // Skip hover behavior if a mood has been selected and this deer's info is already visible
          if (moodSelected && info.classList.contains('visible')) {
            return;
          }
          
          const mouseX = e.pageX;
          const mouseY = e.pageY;
          
          // Only make deer info visible on category pages, not main page
          const currentCategory = document.body.getAttribute('data-current-category');
          
          // Only show info if we're on a category page and this deer matches the category
          const shouldShowInfo = currentCategory && area.category === currentCategory;
          
          if (
            mouseX >= area.left &&
            mouseX <= area.left + area.width &&
            mouseY >= area.top &&
            mouseY <= area.top + area.height
          ) {
            circle.classList.add("active");
            // Only show info if we're on the correct category page
            if (shouldShowInfo) {
              info.classList.add("visible");
              info.style.pointerEvents = "auto";
            }
          } else {
            circle.classList.remove("active");
            // Only hide info if we're not in mood selection mode
            if (!moodSelected) {
              info.classList.remove("visible");
              info.style.pointerEvents = "none";
            }
          }
        };
        
        // Add listener and store reference
        document.addEventListener('mousemove', checkHover);
        hoverListeners.push({ 
          listener: checkHover, 
          deerId: area.id 
        });
      });
    }
    
    // Initialize UI components
    function init() {
      createDeerInfoElements();
      createChatModal();
      updateDeerHoverBehavior();
    }
    
    // Reset all UI components
    function reset() {
      // Remove deer info elements
      document.querySelectorAll('.deer-info').forEach(el => el.remove());
      
      // Remove chat modal
      const chatModal = document.getElementById('chat-modal');
      if (chatModal) {
        chatModal.remove();
      }
      
      // Recreate components
      init();
    }
    
    // Public API
    return {
      init,
      reset,
      openChatModal,
      closeChatModal
    };
  })();

  // Create mood selector UI
  const moodOptions = [
    { emoji: "😊", name: "Happy", value: "happy" },
    { emoji: "😐", name: "Neutral", value: "neutral" },
    { emoji: "😔", name: "Sad", value: "sad" },
    { emoji: "😓", name: "Stressed", value: "stressed" },
    { emoji: "😴", name: "Tired", value: "tired" }
  ];

  function createMoodSelector() {
    const moodContainer = document.createElement("div");
    moodContainer.className = "mood-selector-container";
    
    const moodTitle = document.createElement("p");
    moodTitle.className = "mood-title";
    moodTitle.textContent = "How are you feeling today?";
    moodContainer.appendChild(moodTitle);
    
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "mood-options";
    
    moodOptions.forEach(mood => {
      const option = document.createElement("button");
      option.className = "mood-option";
      option.dataset.mood = mood.value;
      option.title = mood.name;
      option.textContent = mood.emoji;
      option.addEventListener("click", () => selectMood(mood));
      optionsContainer.appendChild(option);
    });
    
    moodContainer.appendChild(optionsContainer);
    
    // Add display for current mood
    const currentMood = document.createElement("div");
    currentMood.className = "current-mood";
    moodContainer.appendChild(currentMood);
    
    document.body.appendChild(moodContainer);
    
    // Check for previously selected mood
    chrome.storage.local.get("mood", (data) => {
      if (data.mood) {
        updateMoodDisplay(data.mood);
      }
    });
  }
  
  function selectMood(mood) {
    // Set mood selected flag
    moodSelected = true;
    
    // Remove selected class from all options
    document.querySelectorAll(".mood-option").forEach(option => {
      option.classList.remove("selected");
      option.classList.remove("pulse");
    });
    
    // Add selected class to the clicked option
    const selectedOption = document.querySelector(`.mood-option[data-mood="${mood.value}"]`);
    if (selectedOption) {
      selectedOption.classList.add("selected");
      selectedOption.classList.add("pulse");
    }
    
    // Update the current mood display
    updateMoodDisplay(mood);
    
    // Store the selected mood
    chrome.storage.local.set({ mood: mood });
    
    // Show encouraging message for mood selection
    const randomMessage = moodEncouragementMessages[mood.value] || moodEncouragementMessages.default;
    const encouragement = randomMessage[Math.floor(Math.random() * randomMessage.length)];
    
    // Create and show a speech bubble with the encouragement
    const existingBubble = document.querySelector('.speech-bubble');
    if (existingBubble) {
      existingBubble.remove();
    }
    
    const speechBubble = document.createElement('div');
    speechBubble.className = 'speech-bubble';
    speechBubble.textContent = encouragement;
    
    // Position the speech bubble near the deer
    const position = { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 };
    speechBubble.style.left = `${position.x - 100}px`; 
    speechBubble.style.top = `${position.y - 150}px`;
    
    document.body.appendChild(speechBubble);
    
    requestAnimationFrame(() => {
      speechBubble.classList.add('animated');
    });
    
    setTimeout(() => {
      speechBubble.remove();
    }, 3000);

    // Make sure UIModule is initialized first
    if (!document.querySelector('.deer-info')) {
      UIModule.init();
    }

    // Show the relevant deer info popup based on mood
    // First, hide all deer info popups
    document.querySelectorAll('.deer-info').forEach(info => {
      info.classList.remove('visible');
      info.style.pointerEvents = 'none';
    });

    // Map moods to deer characters
    let deerToShow;
    switch(mood.value) {
      case 'happy':
        deerToShow = 'deer2'; // Oliver - social, cheerful deer
        break;
      case 'neutral':
        deerToShow = 'deer4'; // Atlas - practical, organized deer
        break;
      case 'sad':
        deerToShow = 'deer5'; // Willow - thoughtful, introspective deer
        break;
      case 'stressed':
        deerToShow = 'deer1'; // Luna - nurturing and patient deer
        break;
      case 'tired':
        deerToShow = 'deer3'; // Hazel - gentle deer
        break;
      default:
        deerToShow = 'deer6'; // Nova - for other moods
    }

    // Show the selected deer info popup and make it interactive
    const deerInfo = document.getElementById(`${deerToShow}-info`);
    if (deerInfo) {
      // Position the deer info in a fixed location that's easily visible
      deerInfo.style.position = 'fixed';
      deerInfo.style.top = '50%';
      deerInfo.style.left = '50%';
      deerInfo.style.transform = 'translate(-50%, -50%)';
      deerInfo.classList.add('visible');
      deerInfo.style.pointerEvents = 'auto';
      deerInfo.style.zIndex = '1000';
    }
  }
  
  function updateMoodDisplay(mood) {
    const currentMoodDisplay = document.querySelector(".current-mood");
    if (currentMoodDisplay) {
      currentMoodDisplay.textContent = `Current mood: ${mood.name}`;
      
      // Also update the selected button
      document.querySelectorAll(".mood-option").forEach(option => {
        option.classList.remove("selected");
      });
      
      const selectedOption = document.querySelector(`.mood-option[data-mood="${mood.value}"]`);
      if (selectedOption) {
        selectedOption.classList.add("selected");
      }
    }
  }
  
  // Mood-specific encouragement messages
  const moodEncouragementMessages = {
    happy: [
      "Wonderful! Your happiness brightens my day!",
      "I'm so glad you're feeling good!",
      "That's fantastic! Keep that energy!",
      "Your positive mood is contagious!"
    ],
    neutral: [
      "Sometimes neutral is just what we need.",
      "That's okay! Each day is different.",
      "A balanced mood is a good foundation.",
      "Today is yours to shape however you want."
    ],
    sad: [
      "I'm here for you on the tougher days.",
      "It's okay not to be okay sometimes.",
      "Small steps forward still count.",
      "Be gentle with yourself today."
    ],
    stressed: [
      "Remember to breathe deeply.",
      "One thing at a time. You've got this.",
      "It's okay to take a break when needed.",
      "Focus on what you can control."
    ],
    tired: [
      "Rest is important too.",
      "Be kind to your body today.",
      "Small, gentle steps are still progress.",
      "Your well-being matters most."
    ],
    default: [
      "Thank you for sharing how you feel!",
      "I appreciate you checking in today.",
      "Your feelings are valid and important.",
      "Taking note of your emotions is great self-care!"
    ]
  };

  // Initial background image with 5 deers
  const initialBackground = "assets/original.jpg";

  // Array of encouraging messages to display when tasks are completed
  const encouragingMessages = [
    "Great job!",
    "You're making progress!",
    "Keep going!",
    "That's one down!",
    "You're doing great!",
    "Way to go!",
    "Awesome work!",
    "You got this!",
    "Nice job!",
    "You're on a roll!",
    "One step closer!",
    "Well done!",
    "Look at you go!",
    "Progress feels good!",
    "You're taking care of things!"
  ];

  // Function to show a speech bubble with an encouraging message
  function showEncouragingMessage(category, backgroundIndex) {
    // Remove any existing speech bubbles
    const existingBubble = document.querySelector('.speech-bubble');
    if (existingBubble) {
      existingBubble.remove();
    }

    // Create a new speech bubble
    const speechBubble = document.createElement('div');
    speechBubble.className = 'speech-bubble';
    
    // Set random encouraging message
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    speechBubble.textContent = randomMessage;
    
    // Get position for speech bubble based on the current category and background
    // The deer position varies by background
    let position = { x: 0, y: 0 };
    
    // Position for each category's deer in the progression images
    const deerPositions = {
      daily: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 },
      home: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 },
      pet: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 },
      friends: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 },
      mind: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 },
      others: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 }
    };
    
    // Use the position for the current category
    position = deerPositions[category] || { x: window.innerWidth * 0.8, y: window.innerHeight * 0.65 };
    
    // Position the speech bubble
    speechBubble.style.left = `${position.x - 100}px`; 
    speechBubble.style.top = `${position.y - 150}px`;
    
    // Add to the document
    document.body.appendChild(speechBubble);
    
    // Add the animated class for fade in/out effect
    requestAnimationFrame(() => {
      speechBubble.classList.add('animated');
    });
    
    // Remove the speech bubble after animation is complete
    setTimeout(() => {
      speechBubble.remove();
    }, 3000);
  }

  // Background images for each category
  const backgroundSets = {
    daily: [
      "assets/A.png",
      "assets/A1.png",
      "assets/A2.png",
      "assets/A3.png",
      "assets/A4.png",
      "assets/A5.png",
    ],
    home: [
      "assets/B.png",
      "assets/B1.png",
      "assets/B2.png",
      "assets/B3.png",
      "assets/B4.png",
      "assets/B5.png",
    ],
    pet: [
      "assets/C.png",
      "assets/C1.png",
      "assets/C2.png",
      "assets/C3.png",
      "assets/C4.png",
      "assets/C5.png",
    ],
    friends: [
      "assets/D.png",
      "assets/D1.png",
      "assets/D2.png",
      "assets/D3.png",
      "assets/D4.png",
      "assets/D5.png",
    ],
    mind: [
      "assets/E.png",
      "assets/E1.png",
      "assets/E2.png",
      "assets/E3.png",
      "assets/E4.png",
      "assets/E5.png",
    ],
    others: [
      "assets/F.png",
      "assets/F1.png",
      "assets/F2.png",
      "assets/F3.png",
      "assets/F4.png",
      "assets/F5.png",
    ],
  };

  // Hover effect logic
  const deerAreas = [
    {
      id: "deer1",
      top: 530,
      left: 400,
      width: 150,
      height: 250,
      circleImage: "assets/circle_selfcare.png",
      category: "daily",
    },
    {
      id: "deer2",
      top: 570,
      left: 1510,
      width: 100,
      height: 200,
      circleImage: "assets/circle_lovedones.png",
      category: "friends",
    },
    {
      id: "deer3",
      top: 630,
      left: 1310,
      width: 100,
      height: 200,
      circleImage: "assets/circle_pets.png",
      category: "pet",
    },
    {
      id: "deer4",
      top: 540,
      left: 800,
      width: 120,
      height: 220,
      circleImage: "assets/circle_thehome.png",
      category: "home",
    },
    {
      id: "deer5",
      top: 600,
      left: 1150,
      width: 90,
      height: 160,
      circleImage: "assets/circle_themind.png",
      category: "mind",
    },
    {
      id: "deer6", // Unique ID for the new hover area
      top: 30, // Adjust the top position to place it in the top right-hand corner
      left: 1280, // Adjust the left position to place it in the top right-hand corner
      width: 150, // Adjust the width of the hover area
      height: 150, // Adjust the height of the hover area
      circleImage: "assets/circle_somethingelse.png", // New image for the hover area
      category: "others", // Link to the "Others" category
    },
  ];

  function removeAllListeners() {
    hoverListeners.forEach((listenerObj) => {
      document.removeEventListener("mousemove", listenerObj.listener);
      document.removeEventListener("click", listenerObj.listener);
    });
    hoverListeners = [];
  }

  deerAreas.forEach((area) => {
    const circle = document.getElementById(`${area.id}-circle`);
    circle.style.backgroundImage = `url(${area.circleImage})`;

    const circleWidth = getComputedStyle(circle).width || "200px";
    const size = parseInt(circleWidth);
    circle.style.left = `${area.left + area.width / 2 - size / 2}px`;
    circle.style.top = `${area.top + area.height / 2 - size / 2}px`;

    // Store the basic hover behavior for the initial state
    // This will be overridden by UIModule when initialized
    const checkHover = (e) => {
      const mouseX = e.pageX;
      const mouseY = e.pageY;

      if (
        mouseX >= area.left &&
        mouseX <= area.left + area.width &&
        mouseY >= area.top &&
        mouseY <= area.top + area.height
      ) {
        circle.classList.add("active");
      } else {
        circle.classList.remove("active");
      }
    };

    // Store listener reference for later removal
    hoverListeners.push({ 
      listener: checkHover, 
      deerId: area.id 
    });
    document.addEventListener("mousemove", checkHover);

    const handleClick = (e) => {
      if (!circle.classList.contains("hidden")) {
        // Only handle clicks when circles are visible
        const mouseX = e.pageX;
        const mouseY = e.pageY;

        if (
          mouseX >= area.left &&
          mouseX <= area.left + area.width &&
          mouseY >= area.top &&
          mouseY <= area.top + area.height
        ) {
          const categoryButton = document.querySelector(
            `.category-button[data-category="${area.category}"]`
          );
          if (categoryButton) {
            categoryButton.click();
            removeAllListeners(); // Remove listeners after category selection
          }
        }
      }
    };

    document.addEventListener("click", handleClick);
    hoverListeners.push({ 
      listener: handleClick, 
      deerId: area.id 
    });
  });

  // Preload image function
  function preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }

  // Function to change background with slide effect
  async function changeBackgroundWithSlide(newImageUrl) {
    try {
      // Preload the new image first
      await preloadImage(newImageUrl);

      return new Promise((resolve) => {
        const currentBg =
          backgroundContainer.querySelector(".background-slide");
        const newBg = document.createElement("div");
        newBg.className = "background-slide";

        // Set initial opacity to 0
        newBg.style.opacity = "0";
        newBg.style.backgroundImage = `url(${newImageUrl})`;

        // Add the new background
        backgroundContainer.appendChild(newBg);

        // Force a reflow to ensure the opacity transition works
        newBg.offsetHeight;

        // Fade in the new background
        requestAnimationFrame(() => {
          newBg.style.opacity = "1";

          if (currentBg) {
            // Start fading out the old background
            currentBg.style.opacity = "0";

            // Remove the old background after transition
            currentBg.addEventListener(
              "transitionend",
              () => {
                currentBg.remove();
                resolve();
              },
              { once: true }
            );
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error("Error loading image:", error);
      return Promise.resolve();
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Function to hide hover circles
  function hideHoverCircles() {
    const hoverCircles = document.querySelectorAll(".deer-circle");
    hoverCircles.forEach((circle) => {
      circle.classList.add("hidden");
    });
  }

  // Function to show hover circles
  function showHoverCircles() {
    const hoverCircles = document.querySelectorAll(".deer-circle");
    hoverCircles.forEach((circle) => {
      circle.classList.remove("hidden");
    });
  }

  // Updated hardcoded tasks with new categories and random selection
  const taskPool = {
    daily: [
      "Brush teeth for two minutes",
      "Take a relaxing shower",
      "Eat a yummy breakfast",
      "Go for a refreshing 20 minute walk",
      "Change into your favorite outfit",
      "Brush your beautiful hair",
      "Floss between all your teeth",
      "Drink three full glasses of water",
      "Eat a serving of fruits or vegetables",
      "Tidy up your bed",
      "Trim your nails",
      "Moisturize your face and body",
      "Take your medications or vitamins",
      "Put on sunscreen",
      "Take five minutes to shave",
    ],
    home: [
      "Wipe down kitchen counters and stove",
      "Vacuum your space",
      "Empty trash bins and replace bags",
      "Load or unload the dishwasher",
      "Make your bed",
      "Clean your bathroom sink, mirror, and toilet",
      "Sweep or mop the floors",
      "Stow away your clutter",
      "Wipe dining table and chairs",
      "Clean the inside of the microwave",
      "Sort mail and papers",
      "Water your plants",
      "Do a quick dusting of surfaces",
      "Put all your stray clothes in the hamper",
      "Organize your desk",
      "Do a load of laundry",
      "Wipe your electronic surfaces clean",
    ],
    pet: [
      "Provide fresh water in bowl",
      "Clean feeding area",
      "Brush fur",
      "Have dedicated playtime together",
      "Give healthy treats as rewards",
      "Monitor food and water intake",
      "Give pets attention and affection",
      "Check skin/coat for any abnormalities",
    ],
    friends: [
      "Send a thoughtful text message to someone you love",
      "Schedule a catch-up call/coffee",
      "Tell someone a nice compliment",
      "Wish someone a happy birthday today",
      "Give a meaningful compliment",
      "Share a memory/photo with someone",
      "Write a handwritten note",
      "Plan a meetup with some friends",
      "Send a short text to a friend you have not heard from lately",
      "Congratulate someone on a recent achievement",
    ],
    mind: [
      "Take 5 minutes to practice mindful breathing",
      "Write 3 things you are grateful for",
      "Listen to calming music",
      "Practice a 5 minute meditation",
      "Journal your current feelings down for ten minutes",
      "Read a chapter of your new book",
      "Follow a 10 minute stretching Youtube video",
      "Write down a list of 3 affirmations for yourself",
      "Organize one small space in your home",
      "Go outside for at least 20 minutes of fresh air",
      "Do one creative activity",
      "Practice Duolingo for 10 minutes",
    ],
  };

  // Function to get 5 random tasks from a category
  function getRandomTasks(category) {
    const tasks = taskPool[category];
    return shuffleArray([...tasks]).slice(0, 5);
  }

  const hardcodedTasks = {
    daily: getRandomTasks("daily"),
    home: getRandomTasks("home"),
    pet: getRandomTasks("pet"),
    friends: getRandomTasks("friends"),
    mind: getRandomTasks("mind"),
  };

  let sortableInstance = null;

  // Load saved state from chrome.storage.local
  chrome.storage.local.get("state", (data) => {
    if (data.state) {
      const {
        tasks,
        backgroundIndex,
        categoriesHidden,
        isFinalImage,
        selectedCategory,
      } = data.state;

      // Create mood selector if it doesn't exist
      if (!document.querySelector(".mood-selector-container")) {
        createMoodSelector();
      }
      
      // Initialize deer info and chat UI
      UIModule.init();
      
      // Initialize API key popup handlers
      initApiKeyPopup();

      if (isFinalImage) {
        changeBackgroundWithSlide(
          backgroundSets[selectedCategory][
            backgroundSets[selectedCategory].length - 1
          ]
        ).then(() => {
          tasksContainer.classList.add("hidden");
          categoriesContainer.classList.add("hidden");
          hideHoverCircles(); // Hide hover circles when the final image is shown
          document.getElementById("welcome-message").classList.add("hidden");
          
          // Hide mood selector when showing thank you message
          const moodSelector = document.querySelector(".mood-selector-container");
          if (moodSelector) {
            moodSelector.classList.add("hidden");
          }
          
          // Create and show thank you message
          const thankYouMessage = document.createElement("div");
          thankYouMessage.className = "thank-you-message";
          thankYouMessage.textContent =
            "Thank you for taking good care of me";
          document.body.appendChild(thankYouMessage);
        });
      } else {
        renderTasks(tasks, backgroundIndex, selectedCategory);
        if (categoriesHidden) {
          categoriesContainer.classList.add("hidden");
          hideHoverCircles(); // Hide hover circles when categories are hidden
          document.getElementById("welcome-message").classList.add("hidden");
        }
        changeBackgroundWithSlide(
          backgroundSets[selectedCategory][backgroundIndex]
        );
      }

      // Initialize delete API key button
      initDeleteApiButton();
    } else {
      //categoriesContainer.classList.remove("hidden");
      document.getElementById("welcome-message").classList.remove("hidden");
      showHoverCircles(); // Show hover circles in the initial state
      changeBackgroundWithSlide(initialBackground);
      
      // Initialize deer info and chat UI for new sessions
      UIModule.init();
      
      // Initialize API key popup for new sessions
      initApiKeyPopup();
    }
  });

  // Add click handler for the "Meet the family" button
  function initApiKeyPopup() {
    const meetFamilyButton = document.getElementById("meet-family-button");
    const apiKeyPopup = document.getElementById("api-key-popup");
    const apiKeyInput = document.getElementById("api-key-input");
    const saveButton = document.getElementById("api-key-save");
    const cancelButton = document.getElementById("api-key-cancel");
    
    // Create delete button container (only shown if API key exists)
    const deleteContainer = document.createElement("div");
    deleteContainer.className = "api-key-delete-container";
    deleteContainer.style.marginTop = "16px";
    deleteContainer.style.padding = "16px 0";
    deleteContainer.style.borderTop = "1px solid rgba(0, 0, 0, 0.1)";
    deleteContainer.style.display = "none"; // Hidden by default
    
    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.id = "api-key-delete";
    deleteButton.className = "api-key-delete";
    deleteButton.textContent = "Delete my API key";
    deleteButton.style.background = "#ef4444";
    deleteButton.style.color = "white";
    deleteButton.style.border = "none";
    deleteButton.style.borderRadius = "8px";
    deleteButton.style.padding = "8px 16px";
    deleteButton.style.cursor = "pointer";
    deleteButton.style.fontFamily = "'DM Sans', sans-serif";
    deleteButton.style.fontSize = "14px";
    deleteButton.style.transition = "background-color 0.2s ease";
    
    // Delete button hover effect
    deleteButton.addEventListener("mouseover", () => {
      deleteButton.style.backgroundColor = "#dc2626";
    });
    
    deleteButton.addEventListener("mouseout", () => {
      deleteButton.style.backgroundColor = "#ef4444";
    });
    
    // Add delete button to container
    deleteContainer.appendChild(deleteButton);
    
    // Add the delete container to the API key popup
    document.querySelector(".api-key-container").appendChild(deleteContainer);
    
    // Check if API key exists and show/hide elements accordingly
    const updateDeleteVisibility = () => {
      if (ChatModule.hasApiKey()) {
        deleteContainer.style.display = "block";
      } else {
        deleteContainer.style.display = "none";
      }
    };

    // Add click handler for delete button
    deleteButton.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete your API key? You will need to enter it again to chat with the deer family.")) {
        ChatModule.clearApiKey();
        apiKeyInput.value = "";
        deleteContainer.style.display = "none";
        
        // Remove indicator from meet family button
        const indicator = meetFamilyButton.querySelector("span");
        if (indicator) {
          indicator.remove();
        }
        
        // Show confirmation
        const message = document.createElement("div");
        message.textContent = "API key deleted successfully";
        message.style.color = "#10B981";
        message.style.marginTop = "8px";
        message.style.fontSize = "14px";
        document.querySelector(".api-key-buttons").appendChild(message);
        
        // Remove confirmation after a few seconds
        setTimeout(() => {
          message.remove();
        }, 3000);
      }
    });

    // Show the API key popup when the "meet the family" button is clicked
    meetFamilyButton.addEventListener("click", () => {
      apiKeyPopup.classList.remove("hidden");
      apiKeyPopup.classList.add("visible");
      
      // Update delete button visibility
      updateDeleteVisibility();
      
      // Check if API key already exists, and pre-fill if it does
      if (ChatModule.hasApiKey()) {
        apiKeyInput.value = "••••••••••••••••••••••••••"; // Placeholder for security
      } else {
        apiKeyInput.value = "";
      }
      
      // Focus the input field
      setTimeout(() => {
        apiKeyInput.focus();
      }, 300);
    });

    // Handle save button click
    saveButton.addEventListener("click", () => {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey && apiKey.startsWith("sk-")) {
        // Save the API key
        ChatModule.setApiKey(apiKey);
        
        // Show a success message
        const successMessage = document.createElement("div");
        successMessage.className = "speech-bubble";
        successMessage.textContent = "API key saved! You can now chat with any deer by hovering over them.";
        
        // Position the message in the center
        successMessage.style.left = `${window.innerWidth / 2 - 150}px`;
        successMessage.style.top = `${window.innerHeight / 2 - 200}px`;
        
        document.body.appendChild(successMessage);
        
        // Add animation
        requestAnimationFrame(() => {
          successMessage.classList.add("animated");
        });
        
        // Remove the message after animation
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
        
        // Close the popup
        closeApiKeyPopup();
      } else {
        // Highlight the input field as invalid
        apiKeyInput.style.borderColor = "#ef4444";
        apiKeyInput.style.backgroundColor = "rgba(254, 226, 226, 0.5)";
        
        // Reset after a short delay
        setTimeout(() => {
          apiKeyInput.style.borderColor = "";
          apiKeyInput.style.backgroundColor = "";
        }, 2000);
      }
    });
    
    // Handle cancel button click
    cancelButton.addEventListener("click", closeApiKeyPopup);
    
    // Close popup function
    function closeApiKeyPopup() {
      apiKeyPopup.classList.remove("visible");
      setTimeout(() => {
        apiKeyPopup.classList.add("hidden");
        apiKeyInput.value = "";
      }, 300);
    }
    
    // Check if API key already exists
    if (ChatModule.hasApiKey()) {
      // Show a small indicator on the button
      const indicator = document.createElement("span");
      indicator.textContent = "✓";
      indicator.style.marginLeft = "5px";
      indicator.style.color = "#10B981";
      meetFamilyButton.appendChild(indicator);
    }
  }

  // Make sure API key popup is initialized for new sessions too
  if (!document.querySelector(".mood-selector-container")) {
    initApiKeyPopup();
  }

  // Initialize delete API key button
  initDeleteApiButton();

  categoriesContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("category-button")) {
      // Reset the mood selected state since we're changing to category mode
      moodSelected = false;
      
      const category = event.target.dataset.category;
      hideHoverCircles();

      // Set the current category on the body for category-specific behavior
      document.body.setAttribute('data-current-category', category);
      
      // Create and show the category-specific circle indicator
      createCategoryCircleIndicator(category);

      if (category === "others") {
        // Create five empty tasks for the "Others" category
        const tasks = Array(5)
          .fill()
          .map(() => ({
            text: "",
            completed: false,
          }));

        chrome.storage.local.set({
          state: {
            tasks,
            backgroundIndex: 0,
            categoriesHidden: true,
            isFinalImage: false,
            selectedCategory: category,
          },
        });

        // Set the background to the category's origin photo (e.g., A.jpg)
        changeBackgroundWithSlide(backgroundSets[category][0]).then(() => {
          // Render the empty tasks
          renderTasks(tasks, 0, category);
        });
      } else {
        const tasks = hardcodedTasks[category].map((task) => ({
          text: task,
          completed: false,
        }));
        chrome.storage.local.set({
          state: {
            tasks,
            backgroundIndex: 0,
            categoriesHidden: true,
            isFinalImage: false,
            selectedCategory: category,
          },
        });
        // Set the background to the category's origin photo (e.g., A.jpg)
        changeBackgroundWithSlide(backgroundSets[category][0]).then(() => {
          renderTasks(tasks, 0, category);
        });
      }

      categoriesContainer.classList.add("hidden");
      hideHoverCircles();
      document.getElementById("welcome-message").classList.add("hidden");
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateSubtasks") {
      const tasks = message.subtasks.map((task) => ({
        text: task,
        completed: false,
      }));
      chrome.storage.local.set({
        state: {
          tasks,
          backgroundIndex: 0,
          categoriesHidden: true,
          isFinalImage: false,
          selectedCategory: "others",
        },
      });
      renderTasks(tasks, 0, "self");
    }
  });

  // Show the reset modal when the reset button is clicked
  resetButton.addEventListener("click", () => {
    resetModal.classList.remove("hidden");
  });

  // Hide the reset modal when "No" is clicked
  resetNoButton.addEventListener("click", () => {
    resetModal.classList.add("hidden");
  });

  // Reset everything when "Yes" is clicked
  resetYesButton.addEventListener("click", () => {
    // Clear the state in chrome.storage.local
    chrome.storage.local.set({ state: null }, () => {
      console.log("State reset to initial state.");
    });
    
    // Reset the mood selection
    chrome.storage.local.remove("mood");
    
    // Reset mood selected state
    moodSelected = false;
    
    // Hide tasks container
    tasksContainer.classList.add("hidden");
    
    // Clear chat history and reset UI
    ChatModule.clearAllData();
    UIModule.reset();
    
    // Remove mood selector if it exists
    const moodSelector = document.querySelector(".mood-selector-container");
    if (moodSelector) {
      moodSelector.remove();
    }
    
    // Clear current category
    document.body.removeAttribute('data-current-category');
    
    // Update API key button indicator
    const meetFamilyButton = document.getElementById("meet-family-button");
    if (meetFamilyButton) {
      // Remove any existing indicator
      const existingIndicator = meetFamilyButton.querySelector("span");
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      // Add indicator if API key exists
      if (ChatModule.hasApiKey()) {
        const indicator = document.createElement("span");
        indicator.textContent = "✓";
        indicator.style.marginLeft = "5px";
        indicator.style.color = "#10B981";
        meetFamilyButton.appendChild(indicator);
      }
    }

    // Reset the UI to the initial state
    tasksContainer.classList.add("hidden");
    document.getElementById("welcome-message").classList.remove("hidden");
    changeBackgroundWithSlide(initialBackground);

    // Remove thank you message if it exists
    const thankYouMessage = document.querySelector(".thank-you-message");
    if (thankYouMessage) {
      thankYouMessage.remove();
    }

    // Reattach hover listeners
    deerAreas.forEach((area) => {
      const circle = document.getElementById(`${area.id}-circle`);

      const checkHover = (e) => {
        const mouseX = e.pageX;
        const mouseY = e.pageY;

        if (
          mouseX >= area.left &&
          mouseX <= area.left + area.width &&
          mouseY >= area.top &&
          mouseY <= area.top + area.height
        ) {
          circle.classList.add("active");
        } else {
          circle.classList.remove("active");
        }
      };

      const handleClick = (e) => {
        if (!circle.classList.contains("hidden")) {
          const mouseX = e.pageX;
          const mouseY = e.pageY;

          if (
            mouseX >= area.left &&
            mouseX <= area.left + area.width &&
            mouseY >= area.top &&
            mouseY <= area.top + area.height
          ) {
            const categoryButton = document.querySelector(
              `.category-button[data-category="${area.category}"]`
            );
            if (categoryButton) {
              categoryButton.click();
              removeAllListeners();
            }
          }
        }
      };

      document.addEventListener("mousemove", checkHover);
      document.addEventListener("click", handleClick);
      hoverListeners.push(checkHover, handleClick);
      circle.classList.remove("hidden");
    });

    // Hide the reset modal
    resetModal.classList.add("hidden");

    // Remove category circle indicator
    const existingIndicators = document.querySelectorAll('.category-circle-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
  });

  function updateBackgroundState(tasks, selectedCategory) {
    const tasksWithContent = tasks.filter((task) => task.text.trim() !== "");
    const completedTasks = tasks.filter(
      (task) => task.completed && task.text.trim() !== ""
    ).length;
    const totalTasksWithContent = tasksWithContent.length;

    let backgroundIndex;
    let isFinalImage = false;

    if (selectedCategory === "others") {
      // For "others" category, increment background based on completed tasks
      backgroundIndex = Math.min(
        completedTasks,
        backgroundSets[selectedCategory].length - 2
      );

      // Only show final image when ALL tasks with content are completed
      if (
        completedTasks === totalTasksWithContent &&
        totalTasksWithContent > 0
      ) {
        backgroundIndex = backgroundSets[selectedCategory].length - 1;
        isFinalImage = true;
      }
    } else {
      // Original logic for other categories
      if (
        completedTasks === totalTasksWithContent &&
        totalTasksWithContent > 0
      ) {
        backgroundIndex = backgroundSets[selectedCategory].length - 1;
        isFinalImage = true;
      } else {
        backgroundIndex = Math.min(
          completedTasks,
          backgroundSets[selectedCategory].length - 1
        );
      }
    }

    return { backgroundIndex, isFinalImage };
  }

  function sortTasksByCompletion(tasks) {
    return [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? -1 : 1;
    });
  }

  function renderTasks(tasks, backgroundIndex, category) {
    const tasksHeader =
      document.getElementById("tasks-header") || document.createElement("div");
    tasksHeader.id = "tasks-header";
    tasksHeader.innerHTML = `
      <h1 class="task-title">today's list</h1>
      <p class="task-subtitle">some tasks to help you feel good</p>
    `;

    if (!document.getElementById("tasks-header")) {
      tasksContainer.innerHTML = "";
      tasksContainer.appendChild(tasksHeader);

      const newTaskList = document.createElement("ul");
      newTaskList.id = "task-list";
      tasksContainer.appendChild(newTaskList);
    }

    const taskListElement = document.getElementById("task-list");
    taskListElement.innerHTML = "";

    const sortedTasks = sortTasksByCompletion(tasks);

    // Create mood selector if it doesn't exist
    if (!document.querySelector(".mood-selector-container")) {
      createMoodSelector();
    }

    sortedTasks.forEach((task, index) => {
      const taskItem = document.createElement("li");
      taskItem.classList.add("draggable");
      taskItem.innerHTML = `
        <input type="checkbox" ${task.completed ? "checked" : ""} />
        <div class="task-text" contenteditable="true" placeholder="New task">${
          task.text
        }</div>
        ${
          task.text && !task.completed
            ? `<button class="delete-task"></button>`
            : ""
        }
        <div class="drag-handle">
         <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>
      `;

      taskItem.draggable = true;
      taskItem.dataset.index = tasks.indexOf(task);

      const checkbox = taskItem.querySelector("input[type='checkbox']");
      checkbox.addEventListener("change", (e) => {
        const originalIndex = tasks.indexOf(task);
        tasks[originalIndex].completed = checkbox.checked;

        if (tasks[originalIndex].completed) {
          // Get the delete button and remove it if it exists
          const deleteButton = taskItem.querySelector(".delete-task");
          if (deleteButton) deleteButton.remove();

          // Calculate new position and state
          let newPosition = 0;
          if (checkbox.checked) {
            newPosition = tasks.filter(
              (t, i) => t.completed && i < originalIndex
            ).length;
          } else {
            newPosition = tasks.filter((t) => t.completed).length;
          }

          const [movedTask] = tasks.splice(originalIndex, 1);
          tasks.splice(newPosition, 0, movedTask);

          const { backgroundIndex: newBackgroundIndex, isFinalImage } =
            updateBackgroundState(tasks, category);

          // Show encouraging message when a task is completed
          showEncouragingMessage(category, newBackgroundIndex);

          if (isFinalImage) {
            changeBackgroundWithSlide(
              backgroundSets[category][backgroundSets[category].length - 1]
            ).then(() => {
              tasksContainer.classList.add("hidden");
              categoriesContainer.classList.add("hidden");
              hideHoverCircles(); // Hide hover circles when the final image is shown
              document.getElementById("welcome-message").classList.add("hidden");
              
              // Hide mood selector when showing thank you message
              const moodSelector = document.querySelector(".mood-selector-container");
              if (moodSelector) {
                moodSelector.classList.add("hidden");
              }
              
              // Create and show thank you message
              const thankYouMessage = document.createElement("div");
              thankYouMessage.className = "thank-you-message";
              thankYouMessage.textContent =
                "Thank you for taking good care of me";
              document.body.appendChild(thankYouMessage);
            });
          } else {
            changeBackgroundWithSlide(
              backgroundSets[category][newBackgroundIndex]
            );
          }

          chrome.storage.local.set({
            state: {
              tasks,
              backgroundIndex: newBackgroundIndex,
              categoriesHidden: true,
              isFinalImage,
              selectedCategory: category,
            },
          });

          if (sortableInstance) {
            const taskItems = Array.from(taskListElement.children);
            const oldItemEl = taskItems[originalIndex];

            taskListElement.removeChild(oldItemEl);
            taskListElement.insertBefore(
              oldItemEl,
              taskListElement.children[newPosition]
            );

            sortableInstance.option("animation", 600);
            sortableInstance.option("onEnd", null);
            const evt = new CustomEvent("sortable:start");
            taskListElement.dispatchEvent(evt);

            oldItemEl.style.transition = "all 600ms ease";
            oldItemEl.style.animation = "moveTask 600ms ease";

            setTimeout(() => {
              oldItemEl.style.transition = "";
              oldItemEl.style.animation = "";
            }, 600);
          }
        }
      });

      const taskTextInput = taskItem.querySelector(".task-text");
      taskTextInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault(); // Prevent the default behavior (new line)
          taskTextInput.blur(); // Exit edit mode
        }
      });

      taskTextInput.addEventListener("input", () => {
        const originalIndex = tasks.indexOf(task);
        tasks[originalIndex].text = taskTextInput.textContent;

        const existingDeleteButton = taskItem.querySelector(".delete-task");

        if (
          tasks[originalIndex].text.trim() !== "" &&
          !tasks[originalIndex].completed &&
          !existingDeleteButton
        ) {
          const deleteButton = document.createElement("button");
          deleteButton.className = "delete-task";

          deleteButton.addEventListener("click", () => {
            tasks.splice(originalIndex, 1);

            if (tasks.length < 5) {
              tasks.push({ text: "", completed: false });
            }

            const { backgroundIndex: newBackgroundIndex, isFinalImage } =
              updateBackgroundState(tasks, category);

            if (isFinalImage) {
              changeBackgroundWithSlide(
                backgroundSets[category][backgroundSets[category].length - 1]
              ).then(() => {
                tasksContainer.classList.add("hidden");
                categoriesContainer.classList.add("hidden");
                document
                  .getElementById("welcome-message")
                  .classList.add("hidden");
                // Hide mood selector when showing thank you message
                const moodSelector = document.querySelector(".mood-selector-container");
                if (moodSelector) {
                  moodSelector.classList.add("hidden");
                }
                // Create and show thank you message
                const thankYouMessage = document.createElement("div");
                thankYouMessage.className = "thank-you-message";
                thankYouMessage.textContent =
                  "Thank you for taking good care of me";
                document.body.appendChild(thankYouMessage);
              });
            } else {
              changeBackgroundWithSlide(
                backgroundSets[category][newBackgroundIndex]
              );
            }

            chrome.storage.local.set({
              state: {
                tasks,
                backgroundIndex: newBackgroundIndex,
                categoriesHidden: true,
                isFinalImage,
                selectedCategory: category,
              },
            });
          });
          taskItem.appendChild(deleteButton);
        }

        chrome.storage.local.set({
          state: {
            tasks,
            backgroundIndex,
            categoriesHidden: true,
            isFinalImage: false,
            selectedCategory: category,
          },
        });
      });

      const deleteButton = taskItem.querySelector(".delete-task");
      if (deleteButton) {
        deleteButton.addEventListener("click", () => {
          const originalIndex = tasks.indexOf(task);
          tasks.splice(originalIndex, 1);

          if (tasks.length < 5) {
            tasks.push({ text: "", completed: false });
          }

          const { backgroundIndex: newBackgroundIndex, isFinalImage } =
            updateBackgroundState(tasks, category);

          if (isFinalImage) {
            changeBackgroundWithSlide(
              backgroundSets[category][backgroundSets[category].length - 1]
            ).then(() => {
              tasksContainer.classList.add("hidden");
              categoriesContainer.classList.add("hidden");
              document
                .getElementById("welcome-message")
                .classList.add("hidden");
              // Hide mood selector when showing thank you message
              const moodSelector = document.querySelector(".mood-selector-container");
              if (moodSelector) {
                moodSelector.classList.add("hidden");
              }
              // Create and show thank you message
              const thankYouMessage = document.createElement("div");
              thankYouMessage.className = "thank-you-message";
              thankYouMessage.textContent =
                "Thank you for taking good care of me";
              document.body.appendChild(thankYouMessage);
            });
          } else {
            changeBackgroundWithSlide(
              backgroundSets[category][newBackgroundIndex]
            );
          }

          chrome.storage.local.set({
            state: {
              tasks,
              backgroundIndex: newBackgroundIndex,
              categoriesHidden: true,
              isFinalImage,
              selectedCategory: category,
            },
          });

          renderTasks(tasks, newBackgroundIndex, category);
        });
      }

      taskListElement.appendChild(taskItem);

      if (!document.querySelector("#task-animations")) {
        const style = document.createElement("style");
        style.id = "task-animations";
        style.textContent = `
          @keyframes moveTask {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
            100% {
              transform: translateY(0);
            }
          }
        `;
        document.head.appendChild(style);
      }
    });

    // Initialize or update SortableJS
    if (sortableInstance) {
      sortableInstance.destroy();
    }

    sortableInstance = new Sortable(taskListElement, {
      animation: 600,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",

      onUpdate: (evt) => {
        const [movedTask] = tasks.splice(evt.oldIndex, 1);
        tasks.splice(evt.newIndex, 0, movedTask);

        const { backgroundIndex: newBackgroundIndex, isFinalImage } =
          updateBackgroundState(tasks, category);

        if (isFinalImage) {
          changeBackgroundWithSlide(
            backgroundSets[category][backgroundSets[category].length - 1]
          ).then(() => {
            tasksContainer.classList.add("hidden");
            categoriesContainer.classList.add("hidden");
            document.getElementById("welcome-message").classList.add("hidden");
            // Hide mood selector when showing thank you message
            const moodSelector = document.querySelector(".mood-selector-container");
            if (moodSelector) {
              moodSelector.classList.add("hidden");
            }
            // Create and show thank you message
            const thankYouMessage = document.createElement("div");
            thankYouMessage.className = "thank-you-message";
            thankYouMessage.textContent =
              "Thank you for taking good care of me";
            document.body.appendChild(thankYouMessage);
          });
        } else {
          changeBackgroundWithSlide(
            backgroundSets[category][newBackgroundIndex]
          );
        }

        chrome.storage.local.set({
          state: {
            tasks,
            backgroundIndex: newBackgroundIndex,
            categoriesHidden: true,
            isFinalImage,
            selectedCategory: category,
          },
        });
      },
    });

    tasksContainer.classList.remove("hidden");
  }

  // Create a circle indicator specific to the current category
  function createCategoryCircleIndicator(category) {
    // Remove any existing indicators
    const existingIndicator = document.querySelector('.category-circle-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Get the deer associated with this category
    let deerName, deerDescription, emoji, position;
    
    switch (category) {
        case 'life':
            deerName = 'Shizuku';
            deerDescription = 'life tasks & habits';
            emoji = '🌱';
            position = { top: '80px', right: '80px' };
            break;
        case 'work':
            deerName = 'Taiyou';
            deerDescription = 'work & productivity';
            emoji = '💼';
            position = { top: '100px', left: '80px' };
            break;
        case 'creativity':
            deerName = 'Eisei';
            deerDescription = 'creativity & passion';
            emoji = '🎨';
            position = { bottom: '100px', right: '100px' };
            break;
        case 'selfcare':
            deerName = 'Hoshi';
            deerDescription = 'self-care & mindfulness';
            emoji = '✨';
            position = { bottom: '120px', left: '120px' };
            break;
        case 'connections':
            deerName = 'Yuuhi';
            deerDescription = 'relationships';
            emoji = '💕';
            position = { top: '50%', right: '80px', transform: 'translateY(-50%)' };
            break;
        case 'others':
            deerName = 'Karasu';
            deerDescription = 'misc & other';
            emoji = '🌈';
            position = { top: '50%', left: '80px', transform: 'translateY(-50%)' };
            break;
        default:
            return; // Don't create an indicator if no valid category
    }

    // Create the indicator
    const indicator = document.createElement('div');
    indicator.className = 'category-circle-indicator';
    
    // Apply custom positioning
    Object.keys(position).forEach(prop => {
        indicator.style[prop] = position[prop];
    });
    
    indicator.innerHTML = `
        <div class="circle-inner">
            <div class="circle-emoji">${emoji}</div>
            <div class="circle-title">${deerName}</div>
            <div class="circle-description">${deerDescription}</div>
        </div>
    `;
    
    document.body.appendChild(indicator);
  }

  // Initialize delete API key button
  function initDeleteApiButton() {
    const deleteApiButton = document.getElementById('delete-api-button');
    
    // Function to update button visibility based on API key existence
    const updateButtonVisibility = () => {
      if (ChatModule.hasApiKey()) {
        deleteApiButton.classList.remove('hidden');
      } else {
        deleteApiButton.classList.add('hidden');
      }
    };
    
    // Set initial visibility
    updateButtonVisibility();
    
    // Add click event handler
    deleteApiButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete your OpenAI API key? You will need to enter it again to chat with the deer family.')) {
        ChatModule.clearApiKey();
        
        // Show a success message
        const successMessage = document.createElement('div');
        successMessage.className = 'speech-bubble';
        successMessage.textContent = 'API key deleted successfully';
        successMessage.style.left = `${window.innerWidth / 2 - 100}px`;
        successMessage.style.top = `${window.innerHeight / 2 - 50}px`;
        document.body.appendChild(successMessage);
        
        // Animate the message
        requestAnimationFrame(() => {
          successMessage.classList.add('animated');
        });
        
        // Remove the message after animation
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
        
        // Update meet-family-button indicator
        const meetFamilyButton = document.getElementById('meet-family-button');
        const indicator = meetFamilyButton.querySelector('span');
        if (indicator) {
          indicator.remove();
        }
        
        // Update button visibility
        updateButtonVisibility();
      }
    });
    
    // Listen for API key changes to update button visibility
    document.addEventListener('apiKeyChanged', updateButtonVisibility);
  }
});
