console.log("Claude Copilot Extension activated");

function createCompareButton() {
  const button = document.createElement("button");
  button.textContent = "Improve prompt";
  button.className =
    "text-white rounded text-sm font-medium transition-colors inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 border-transparent transition-colors font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 h-8 rounded-md px-3 text-xs min-w-[4rem] active:scale-[0.985] whitespace-nowrap pl-2 pr-2.5 gap-1 !rounded-lg font-medium sm:text-sm groq-compare-button";
  return button;
}

function createLoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.className =
    "animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white ml-2";
  return spinner;
}

function createPromptComparison(originalPrompt, improvedPrompt) {
  // Overlay background with blur effect
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-black backdrop-blur-sm";
  overlay.style.cssText = "z-index: 999999; backdrop-filter: blur(4px);";

  const container = document.createElement("div");
  container.className =
    "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-bg-200 to-bg-100 rounded-lg p-6 shadow-2xl w-[80vw] max-w-2xl";
  container.style.cssText = `
    z-index: 1000000; 
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  `;

  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.className =
    "absolute top-2 right-3 text-gray-400 hover:text-white text-2xl font-bold transition-colors";

  const closeModal = () => {
    overlay.classList.add("improved-prompt-fade-out");
    container.classList.add("improved-prompt-fade-out");
    setTimeout(() => {
      overlay.remove();
      container.remove();
    }, 150);
  };

  closeButton.onclick = closeModal;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };

  const style = document.createElement("style");
  style.textContent = `
    @keyframes improvedPromptFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes improvedPromptSlideIn {
      from { transform: translate(-50%, -45%); opacity: 0; }
      to { transform: translate(-50%, -50%); opacity: 1; }
    }
    .improved-prompt-fade-out {
      opacity: 0;
      transition: opacity 150ms ease-out;
    }
  `;
  document.head.appendChild(style);

  const originalSection = document.createElement("div");
  originalSection.className = "mb-4";
  originalSection.innerHTML = `
    <div class="text-sm text-gray-400 mb-2">Original Prompt:</div>
    <div class="p-3 rounded bg-red-100/10 text-red-200 border border-red-500/20">${originalPrompt}</div>
  `;

  const improvedSection = document.createElement("div");
  improvedSection.className = "mb-4";
  improvedSection.innerHTML = `
    <div class="text-sm text-gray-400 mb-2">Improved Prompt:</div>
    <div class="p-3 rounded bg-green-100/10 text-green-200 border border-green-500/20">${improvedPrompt}</div>
  `;

  const acceptButton = document.createElement("button");
  acceptButton.className =
    "text-white rounded text-sm font-medium transition-colors inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 border-transparent transition-colors font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 h-8 rounded-md px-3 text-xs min-w-[4rem] active:scale-[0.985] whitespace-nowrap pl-2 pr-2.5 gap-1 !rounded-lg font-medium sm:text-sm groq-compare-button";
  acceptButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
    </svg>
    Apply Improved Prompt
  `;

  // Add elements to container
  container.appendChild(closeButton);
  container.appendChild(originalSection);
  container.appendChild(improvedSection);
  container.appendChild(acceptButton);

  overlay.style.animation = "improvedPromptFadeIn 150ms ease-out forwards";
  container.style.animation = "improvedPromptSlideIn 150ms ease-out forwards";

  // Escape key listener
  const handleKeydown = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleKeydown);
    }
  };
  document.addEventListener("keydown", handleKeydown);

  return { overlay, container, acceptButton };
}

function getInputDiv() {
  const inputDivs = document.querySelectorAll('[contenteditable="true"]');
  return inputDivs[inputDivs.length - 1];
}

function showLoadingState(button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Improving...";
  const spinner = createLoadingSpinner();
  button.appendChild(spinner);

  return () => {
    button.disabled = false;
    button.textContent = originalText;
  };
}

function updateInput(inputDiv, newText) {
  inputDiv.textContent = newText;
  inputDiv.dispatchEvent(new Event("input", { bubbles: true }));
  inputDiv.dispatchEvent(new Event("change", { bubbles: true }));
}

async function handleCompareClick(event) {
  const button = event.target;
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

  const resetLoading = showLoadingState(button);

  try {
    console.log("Sending to backend:", currentText);

    const response = await fetch("http://localhost:3000/api/improve-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: currentText }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Improved prompt:", data.improvedPrompt);

    const { overlay, container, acceptButton } = createPromptComparison(
      currentText,
      data.improvedPrompt
    );

    acceptButton.addEventListener("click", () => {
      updateInput(inputDiv, data.improvedPrompt);
      overlay.remove();
      container.remove();
    });

    document.body.appendChild(overlay);
    document.body.appendChild(container);
  } catch (error) {
    console.error("Error improving prompt:", error);
    // Error notification
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50";
    notification.textContent = "Failed to improve prompt. Please try again.";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  } finally {
    resetLoading();
  }
}

function initializeExtension() {
  console.log("Initializing Claude Copilot Extension");

  const addButton = () => {
    let inputContainer = document.querySelector(
      ".flex.min-w-0.items-center.gap-0\\.5"
    );
    if (!inputContainer) {
      inputContainer = document.querySelector(
        ".cursor-pointer.hover\\:bg-bg-100.text-xs.text-text-500"
      );
    }

    if (!inputContainer) {
      return;
    }

    // Check if button already exists
    if (!document.querySelector(".groq-compare-button")) {
      const button = createCompareButton();
      inputContainer.insertAdjacentElement("afterend", button);
      button.addEventListener("click", handleCompareClick);
      console.log("Button added");
    }
  };

  let timeoutId = null;
  const debouncedAddButton = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(addButton, 500);
  };

  debouncedAddButton();

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
