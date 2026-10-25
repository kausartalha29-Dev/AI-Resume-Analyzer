"use strict";

// =====================================================
// ELEMENTS
// =====================================================

const resumeFile = document.getElementById("resumeFile");
const jobDescription = document.getElementById("jobDescription");
const filenameText = document.getElementById("filename");

const heroButton = document.querySelector(".hero .analyze-btn");
const analyzeButton = document.querySelector(".analyzer .analyze-btn");


// =====================================================
// HERO BUTTON
// =====================================================

if (heroButton) {
    heroButton.addEventListener("click", function (event) {
        event.preventDefault();

        const analyzer = document.querySelector(".analyzer");

        if (analyzer) {
            analyzer.scrollIntoView({ behavior: "smooth" });
        }
    });
}


// =====================================================
// FILE SELECTION
// =====================================================

if (resumeFile) {
    resumeFile.addEventListener("change", function () {
        if (filenameText) {
            filenameText.textContent = resumeFile.files[0]
                ? resumeFile.files[0].name
                : "";
        }
    });
}


// =====================================================
// RESULTS CONTAINER
// =====================================================

let resultsBox = document.getElementById("results");

if (!resultsBox) {
    resultsBox = document.createElement("section");
    resultsBox.id = "results";

    const analyzer = document.querySelector(".analyzer");

    if (analyzer) {
        analyzer.appendChild(resultsBox);
    }
}

if (resultsBox) {
    resultsBox.style.cssText = `
        box-sizing: border-box;
        margin: 28px auto;
        padding: 26px;
        width: 100%;
        max-width: 850px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 5px 24px rgba(0, 0, 0, 0.09);
        color: #243047;
        display: none;
        overflow-wrap: anywhere;
        line-height: 1.7;
        font-size: 15px;
    `;
}


// =====================================================
// SAFE ELEMENT HELPERS
// =====================================================

function createElement(tag, text, className) {
    const element = document.createElement(tag);

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    if (className) {
        element.className = className;
    }

    return element;
}


function showError(message) {
    resultsBox.replaceChildren();

    const heading = createElement(
        "h2",
        "Analysis Could Not Complete"
    );

    const paragraph = createElement("p", message);

    resultsBox.append(heading, paragraph);
    resultsBox.style.display = "block";
    resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
}


function showLoading() {
    resultsBox.replaceChildren();

    const heading = createElement("h2", "Analyzing Your Resume");

    const message = createElement(
        "p",
        "Please wait while we compare your resume with the job description."
    );

    resultsBox.append(heading, message);
    resultsBox.style.display = "block";
}


// =====================================================
// KEYWORD SECTIONS
// =====================================================

function addKeywordSection(title, items, emptyMessage) {
    const section = createElement("section");
    section.style.marginTop = "22px";

    const heading = createElement("h3", title);
    heading.style.marginBottom = "10px";

    section.appendChild(heading);

    if (!Array.isArray(items) || items.length === 0) {
        section.appendChild(createElement("p", emptyMessage));
        resultsBox.appendChild(section);
        return;
    }

    const list = createElement("ul");
    list.style.paddingLeft = "24px";

    items.forEach(item => {
        const li = createElement("li", item);
        li.style.marginBottom = "4px";
        list.appendChild(li);
    });

    section.appendChild(list);
    resultsBox.appendChild(section);
}


// =====================================================
// MARKDOWN DISPLAY
// Supports headings, lists, paragraphs and bold text.
// All user/API text is inserted safely as text, not HTML.
// =====================================================

function appendInlineText(container, text) {
    const parts = String(text).split(/(\*\*[^*]+\*\*)/g);

    parts.forEach(part => {
        if (part.startsWith("**") && part.endsWith("**")) {
            const strong = document.createElement("strong");
            strong.textContent = part.slice(2, -2);
            container.appendChild(strong);
        } else if (part) {
            container.appendChild(document.createTextNode(part));
        }
    });
}


function renderMarkdown(markdown) {
    const wrapper = createElement("div");
    wrapper.style.lineHeight = "1.8";

    const lines = String(markdown)
        .replace(/\r\n/g, "\n")
        .split("\n");

    let currentList = null;
    let paragraphLines = [];

    function flushParagraph() {
        if (paragraphLines.length === 0) {
            return;
        }

        const paragraph = createElement("p");
        paragraph.style.margin = "8px 0";

        appendInlineText(
            paragraph,
            paragraphLines.join(" ").trim()
        );

        wrapper.appendChild(paragraph);
        paragraphLines = [];
    }

    function closeList() {
        currentList = null;
    }

    lines.forEach(rawLine => {
        const line = rawLine.trim();

        if (!line) {
            flushParagraph();
            closeList();
            return;
        }

        // Markdown headings: # Heading, ## Heading, etc.
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

        if (headingMatch) {
            flushParagraph();
            closeList();

            const level = Math.min(headingMatch[1].length + 1, 6);
            const heading = createElement(
                `h${level}`,
                headingMatch[2].replace(/\*\*/g, "")
            );

            heading.style.marginTop = "20px";
            heading.style.marginBottom = "8px";

            wrapper.appendChild(heading);
            return;
        }

        // Bullet lists and numbered lists.
        const listMatch = line.match(/^([-*+]|\d+[.)])\s+(.+)$/);

        if (listMatch) {
            flushParagraph();

            const ordered = /^\d+[.)]$/.test(listMatch[1]);
            const expectedTag = ordered ? "OL" : "UL";

            if (!currentList || currentList.tagName !== expectedTag) {
                closeList();

                currentList = createElement(ordered ? "ol" : "ul");
                currentList.style.paddingLeft = "24px";
                currentList.style.margin = "8px 0";

                wrapper.appendChild(currentList);
            }

            const item = createElement("li");
            item.style.marginBottom = "6px";

            appendInlineText(item, listMatch[2]);

            currentList.appendChild(item);
            return;
        }

        closeList();
        paragraphLines.push(line);
    });

    flushParagraph();

    return wrapper;
}


// =====================================================
// ANALYSIS RESULTS
// =====================================================

function renderResults(data) {
    resultsBox.replaceChildren();

    const heading = createElement("h2", "Your Resume Analysis");
    heading.style.marginTop = "0";

    resultsBox.appendChild(heading);

    // Match score
    const scoreValue = Number(data.match_percentage);
    const validScore = Number.isFinite(scoreValue)
        ? Math.max(0, Math.min(100, scoreValue))
        : 0;

    const scoreHeading = createElement(
        "h3",
        `Keyword Match: ${validScore}%`
    );

    resultsBox.appendChild(scoreHeading);

    const scoreNote = createElement(
        "p",
        "This score measures keyword overlap. It does not measure your overall suitability for the job."
    );

    resultsBox.appendChild(scoreNote);

    // Score bar
    const progressTrack = createElement("div");
    progressTrack.style.cssText = `
        width: 100%;
        height: 10px;
        background: #e8edf3;
        border-radius: 8px;
        overflow: hidden;
        margin: 14px 0 20px;
    `;

    const progressFill = createElement("div");
    progressFill.style.cssText = `
        height: 100%;
        width: ${validScore}%;
        background: #4776e6;
        border-radius: 8px;
        transition: width 0.3s ease;
    `;

    progressTrack.appendChild(progressFill);
    resultsBox.appendChild(progressTrack);

    // Keyword lists
    addKeywordSection(
        "Matching Keywords",
        data.matching_keywords,
        "No matching keywords were identified."
    );

    addKeywordSection(
        "Missing Keywords",
        data.missing_keywords,
        "No missing keywords were identified."
    );

    // Suggestions
    addKeywordSection(
        "Resume Improvement Suggestions",
        data.suggestions,
        "No suggestions are available."
    );

    // AI availability notice
    if (data.ai_status === "unavailable" || !data.ai_analysis) {
        const notice = createElement("section");
        notice.style.cssText = `
            margin-top: 24px;
            padding: 16px;
            border-radius: 10px;
            background: #fff7e6;
            border: 1px solid #f3d49b;
        `;

        notice.appendChild(
            createElement("h3", "AI Analysis Temporarily Unavailable")
        );

        notice.appendChild(
            createElement(
                "p",
                data.ai_message ||
                "Keyword analysis is available, but the AI-generated assessment could not be completed. Please try again later."
            )
        );

        resultsBox.appendChild(notice);
    } else {
        const aiSection = createElement("section");
        aiSection.style.marginTop = "28px";

        const aiHeading = createElement("h2", "AI Feedback");
        aiSection.appendChild(aiHeading);

        aiSection.appendChild(
            renderMarkdown(data.ai_analysis)
        );

        resultsBox.appendChild(aiSection);
    }

    // Disclaimer
    if (data.disclaimer) {
        const disclaimer = createElement("p", data.disclaimer);

        disclaimer.style.cssText = `
            margin-top: 24px;
            padding-top: 14px;
            border-top: 1px solid #e6eaf0;
            font-size: 13px;
            color: #657084;
        `;

        resultsBox.appendChild(disclaimer);
    }

    resultsBox.style.display = "block";

    resultsBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// =====================================================
// ANALYZE RESUME
// =====================================================

if (analyzeButton) {
    analyzeButton.addEventListener("click", async function (event) {
        event.preventDefault();

        if (!resumeFile || !resumeFile.files || !resumeFile.files[0]) {
            alert("Please choose your resume first.");
            return;
        }

        if (!jobDescription || !jobDescription.value.trim()) {
            alert("Please paste a job description.");
            return;
        }

        const file = resumeFile.files[0];
        const filename = file.name.toLowerCase();

        // The current backend supports PDF and DOCX.
        const allowedExtensions = [".pdf", ".docx"];

        if (!allowedExtensions.some(ext => filename.endsWith(ext))) {
            alert("Please upload a PDF or DOCX resume.");
            return;
        }

        const formData = new FormData();

        formData.append("resume", file);
        formData.append(
            "job_description",
            jobDescription.value.trim()
        );

        showLoading();
        analyzeButton.disabled = true;

        const originalButtonText = analyzeButton.textContent;
        analyzeButton.textContent = "Analyzing...";

        const controller = new AbortController();

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 60000);

        try {
            const response = await fetch(
                "http://127.0.0.1:5000/analyze",
                {
                    method: "POST",
                    body: formData,
                    signal: controller.signal
                }
            );

            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(
                    `The server returned an unexpected response (HTTP ${response.status}). Check the Flask terminal.`
                );
            }

            if (!response.ok || data.status !== "success") {
                throw new Error(
                    data.message ||
                    `The server returned HTTP ${response.status}.`
                );
            }

            renderResults(data);

        } catch (error) {
            console.error("Resume analysis error:", error);

            if (error.name === "AbortError") {
                showError(
                    "The request took longer than 60 seconds. Check whether Flask is running and whether the AI service is responding."
                );
            } else if (error instanceof TypeError) {
                showError(
                    "Cannot connect to the backend. Start Flask with 'py app.py' and try again."
                );
            } else {
                showError(
                    error.message || "An unexpected error occurred."
                );
            }

        } finally {
            clearTimeout(timeoutId);
            analyzeButton.disabled = false;
            analyzeButton.textContent = originalButtonText;
        }
    });
}