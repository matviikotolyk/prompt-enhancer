const apiKey = "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";

console.log("Claude Copilot Extension activated");

function createGroqClient() {
  return {
    chat: {
      completions: {
        create: async ({ messages }) => {
          try {
            const response = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "llama-3.1-70b-versatile",
                  messages: messages,
                  temperature: 0.7,
                  max_tokens: 4096,
                }),
              }
            );

            if (!response.ok) {
              throw new Error(`Groq API error: ${response.status}`);
            }

            return await response.json();
          } catch (error) {
            console.error("Error calling Groq API:", error);
            throw error;
          }
        },
      },
    },
  };
}

function createCompareButton() {
  const button = document.createElement("button");
  button.textContent = "Improve prompt";
  button.className =
    "text-white rounded text-sm font-medium transition-colors inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 border-transparent transition-colors font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 h-8 rounded-md px-3 text-xs min-w-[4rem] active:scale-[0.985] whitespace-nowrap pl-2 pr-2.5 gap-1 !rounded-lg font-medium sm:text-sm groq-compare-button";
  return button;
}

function getInputDiv() {
  // Get the current input div - the last contenteditable div
  const inputDivs = document.querySelectorAll('[contenteditable="true"]');
  return inputDivs[inputDivs.length - 1];
}

async function handleCompareClick() {
  const inputDiv = getInputDiv();
  if (!inputDiv) {
    console.log("No input div found");
    return;
  }

  const currentText = inputDiv.textContent.trim();
  if (!currentText) {
    console.log("No text to improve");
    return;
  }

  console.log("Sending to Groq:", currentText);

  try {
    const groq = createGroqClient();
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "Act as a helpful AI assistant improving the user prompt for another AI model to understand. Your goal is not to respond to the user prompt but rather improve the prompt itself, making it complete and easy for an AI to understand. You can improve the prompt by adding more information, clarifying the intent, or adding examples. You should not add any explanations or comments. IMPORTANT: only output the updated prompt itself without quotation marks and other formatting. The user prompt is: " +
            currentText,
        },
      ],
    });

    const improvedPrompt = response.choices[0].message.content;
    console.log("Improved prompt:", improvedPrompt);

    // Update the input div with the improved prompt
    inputDiv.textContent = improvedPrompt;
    inputDiv.dispatchEvent(new Event("input", { bubbles: true }));
    inputDiv.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (error) {
    console.error("Error improving prompt:", error);
  }
}

function initializeExtension() {
  console.log("Initializing Claude Copilot Extension");

  // Function to add button to the input container
  const addButton = () => {
    const inputContainer = document.querySelector(
      ".flex.min-w-0.items-center.gap-0\\.5"
    );
    if (!inputContainer) return;

    // Check if button already exists
    if (!document.querySelector(".groq-compare-button")) {
      const button = createCompareButton();
      inputContainer.insertAdjacentElement("afterend", button);
      button.addEventListener("click", handleCompareClick);
      console.log("Button added");
    }
  };

  // Create a debounced version of addButton
  let timeoutId = null;
  const debouncedAddButton = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(addButton, 500);
  };

  // Initial call
  debouncedAddButton();

  // Observe changes
  const observer = new MutationObserver((mutations) => {
    let shouldAddButton = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length || mutation.removedNodes.length) {
        shouldAddButton = true;
      }
    });

    if (shouldAddButton) {
      debouncedAddButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (window.location.hostname === "claude.ai") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeExtension);
  } else {
    initializeExtension();
  }
}
