// Default skill definitions - seeded into DB on first launch

import type { CreateSkillInput } from "./custom-skill-store.js";

export const DEFAULT_SKILLS: CreateSkillInput[] = [
  {
    name: "frontend_design",
    description:
      "Create production-grade web components, pages, dashboards, or React UI with distinctive, modern design. Use when the user asks to build web interfaces, landing pages, or frontend components.",
    parameters: [
      {
        name: "request",
        type: "string",
        description: "What to build — describe the component, page, or UI element",
        required: true,
      },
    ],
    promptTemplate: `You are a world-class frontend designer and developer. Create production-grade HTML/CSS/JS or React code based on this request:

{{request}}

## Design Principles

**Typography**: Choose distinctive, characterful fonts. Pair a display font with a body font deliberately. Never default to system fonts alone.

**Color & Theme**: Build a cohesive palette using CSS variables. Use HSL for easy adjustment. Ensure WCAG contrast ratios.

**Layout**: Use CSS Grid and Flexbox for responsive layouts. Consider asymmetry, overlap, and negative space. Avoid cookie-cutter grid patterns.

**Motion**: Add meaningful animations — page transitions, scroll-triggered reveals, hover states, micro-interactions. Use CSS transitions and @keyframes. Keep animations under 300ms for interactions, up to 800ms for reveals.

**Visual Polish**: Apply subtle gradients, textures, shadows for depth. Use backdrop-filter for glass effects. Add border-radius variety.

## Output Requirements
- Generate complete, runnable files that can be opened directly in a browser
- Use Tailwind CSS when appropriate, or custom CSS for more control
- Include responsive breakpoints (mobile, tablet, desktop)
- Add dark mode support via prefers-color-scheme or class toggle
- Include smooth transitions between states
- Write clean, well-structured code with comments for complex sections

Save the output files using the filesystem tool. For single-file projects, save as an .html file with inline styles and scripts.`,
  },

  {
    name: "create_docx",
    description:
      "Create or edit Word documents (.docx) with professional formatting including headings, tables, images, headers/footers, and page layouts. Use when the user needs to generate reports, memos, letters, or formatted documents.",
    parameters: [
      {
        name: "request",
        type: "string",
        description: "What document to create or how to modify an existing one",
        required: true,
      },
    ],
    promptTemplate: `Create or edit a Word document (.docx) based on this request:

{{request}}

## Approach

Use Python's \`python-docx\` library. Install if needed: \`pip3 install python-docx\`

## Capabilities
- **Styles**: Heading 1-4, Normal, Quote, List Bullet, List Number, Intense Quote
- **Tables**: Formatted with borders, shading, merged cells
- **Headers/Footers**: Different first page, page numbers, logos
- **Images**: Embed with proper sizing and positioning
- **Page Layout**: Margins, orientation (portrait/landscape), page breaks, section breaks
- **Formatting**: Bold, italic, underline, font size/color, paragraph spacing, alignment
- **Table of Contents**: Add TOC field codes (update on open)

## Quality Standards
- Use consistent heading hierarchy
- Apply professional font choices (Calibri, Times New Roman, Arial)
- Set proper margins (1 inch default, or as specified)
- Include page numbers in footer for multi-page documents
- Use paragraph spacing (6pt before, 0pt after for body text)

Write a Python script, execute it via exec, and save the .docx file. Tell the user where the file was saved.`,
  },

  {
    name: "handle_pdf",
    description:
      "Read, create, merge, split, rotate, extract text from, or perform OCR on PDF files. Use when the user needs any PDF-related operation.",
    parameters: [
      {
        name: "request",
        type: "string",
        description: "What PDF operation to perform (read, create, merge, split, extract, etc.)",
        required: true,
      },
    ],
    promptTemplate: `Handle a PDF operation based on this request:

{{request}}

## Tools & Libraries

Install as needed:
- **pdfplumber**: Text/table extraction with layout preservation — \`pip3 install pdfplumber\`
- **pypdf**: Merge, split, rotate, encrypt/decrypt pages — \`pip3 install pypdf\`
- **reportlab**: Create new PDFs from scratch — \`pip3 install reportlab\`

## Operation Guide

**Reading/Extracting**:
- Use pdfplumber for text extraction (preserves layout)
- Extract tables with \`page.extract_tables()\`
- For scanned documents, note if OCR is needed

**Creating**:
- Use reportlab for generating new PDFs
- Set proper page size (A4/Letter), margins, fonts
- Include headers, footers, page numbers

**Manipulating**:
- pypdf for merging: \`PdfMerger().append()\`
- pypdf for splitting: iterate pages, write individually
- pypdf for rotating: \`page.rotate(90)\`

**Encryption**: \`writer.encrypt(password)\`

Write a Python script, execute it via exec, and report the result. Tell the user where output files were saved.`,
  },

  {
    name: "create_pptx",
    description:
      "Create or edit PowerPoint presentations (.pptx) with professional slide design, layouts, images, charts, and animations. Use when the user needs presentations or slide decks.",
    parameters: [
      {
        name: "request",
        type: "string",
        description: "What presentation to create or how to modify an existing one",
        required: true,
      },
    ],
    promptTemplate: `Create or edit a PowerPoint presentation based on this request:

{{request}}

## Approach

Use Python's \`python-pptx\` library. Install if needed: \`pip3 install python-pptx\`

## Design Standards

**Layout Variety**: Alternate between title slides, content slides, two-column layouts, image-focused slides. Never repeat the same layout 3 times in a row.

**Color Palette**: Choose a topic-appropriate color scheme. Use 60-70% primary color dominance. Apply consistent accent colors for highlights.

**Typography**:
- Titles: 36-44pt, bold
- Body: 14-16pt, regular
- Use at most 2 font families per presentation

**Content Rules**:
- Avoid text-only slides — include shapes, icons, or visual elements
- Maximum 6 bullet points per slide
- Keep bullet text concise (1-2 lines each)
- Use speaker notes for additional detail

**Visual Elements**:
- Add colored shape backgrounds to section headers
- Use consistent icon style throughout
- Include slide numbers

## Quality Checklist
- No text overflow beyond slide boundaries
- Consistent spacing and alignment
- Proper contrast between text and background
- Smooth visual flow from slide to slide

Write a Python script, execute it via exec, and save the .pptx file. Tell the user where the file was saved.`,
  },

  {
    name: "handle_xlsx",
    description:
      "Create or edit Excel spreadsheets (.xlsx) with formulas, formatting, charts, and data analysis. Use when the user needs spreadsheets, data tables, financial models, or data processing.",
    parameters: [
      {
        name: "request",
        type: "string",
        description: "What spreadsheet to create or how to process data",
        required: true,
      },
    ],
    promptTemplate: `Create or edit an Excel spreadsheet based on this request:

{{request}}

## Approach

Use Python's \`openpyxl\` for spreadsheet creation with formatting and formulas. Use \`pandas\` for data processing. Install if needed: \`pip3 install openpyxl pandas\`

## Standards

**Formulas**: Use Excel formulas (SUM, VLOOKUP, IF, INDEX/MATCH, etc.) — never hardcode calculated values.

**Formatting**:
- Headers: Bold, colored background, borders
- Numbers: Proper format (currency, percentage, dates)
- Column widths: Auto-fit or set to readable sizes
- Freeze panes on header row

**Professional Fonts**: Arial or Calibri, 10-11pt body

**Color Coding** (for financial models):
- Blue: Input cells
- Black: Formula cells
- Green: Cross-sheet links
- Red: External data links

**Data Validation**:
- Zero formula errors (#REF!, #DIV/0!, #NAME?, #VALUE!)
- Years formatted as text (not numbers)
- Currency with proper units
- Percentages at 0.0% format

**Charts** (when requested):
- Clear title and axis labels
- Proper data range selection
- Consistent color scheme

Write a Python script, execute it via exec, and save the .xlsx file. Tell the user where the file was saved.`,
  },

  {
    name: "skill_creator",
    description:
      "Design, test, and refine new reusable skill templates for CatClaw. Use when the user wants to create a new custom skill or improve an existing one.",
    parameters: [
      {
        name: "request",
        type: "string",
        description: "What skill to create or improve",
        required: true,
      },
    ],
    promptTemplate: `Help the user create or improve a CatClaw skill based on this request:

{{request}}

## Skill Creation Process

### 1. Intent Capture
- What should the skill do?
- When should it be triggered?
- What parameters does it need?
- What are 2-3 test cases?

### 2. Design the Skill
A skill has these fields:
- **Name**: Short, descriptive, snake_case (e.g., \`code_review\`, \`git_summary\`)
- **Description**: 1-2 sentences explaining what it does and when to use it. This is what the AI reads to decide whether to invoke the skill.
- **Parameters**: Each has name, type (string/number/boolean), description, required flag
- **Prompt Template**: The instructions the AI follows when the skill is invoked. Use \`{{paramName}}\` for parameter placeholders.

### 3. Write the Prompt Template
- Be specific about the desired output format
- Include quality standards and constraints
- Explain the "why" behind guidelines (helps the AI make judgment calls)
- Keep under 500 lines
- Avoid overfitting to specific examples

### 4. Test Cases
Provide 2-3 realistic prompts that would invoke this skill, along with expected behavior.

## Output
Present the complete skill definition to the user so they can review and create it in the Skills panel. Format it clearly with all fields.`,
  },

  {
    name: "web_search",
    description:
      "Search the web for information, fetch content from URLs, and extract data from web pages. Use when the user needs current information, web research, or content from specific URLs.",
    parameters: [
      {
        name: "request",
        type: "string",
        description: "What to search for or which URL to fetch and what to extract",
        required: true,
      },
    ],
    promptTemplate: `Perform web research based on this request:

{{request}}

## Available Methods

### Search & Discover
- Use \`curl\` with search engines or APIs to find relevant pages
- Use Jina Reader (\`curl -sL "https://r.jina.ai/URL"\`) to convert web pages to clean markdown — great for articles, docs, blogs

### Fetch Specific URLs
- Use \`curl -sL URL\` for raw HTML/API responses
- Use Jina Reader prefix for readable content extraction
- Use \`open URL\` to open in user's browser (for interactive pages)

### Content Extraction
- For JSON APIs: parse with \`python3 -c\` or \`node -e\`
- For HTML: extract with curl + grep/sed, or use Python's BeautifulSoup (\`pip3 install beautifulsoup4\`)

## Guidelines
- Prefer primary sources (official docs, original articles) over aggregators
- When multiple sources conflict, note the discrepancy
- Include source URLs in your response
- For authenticated/private content, tell the user to open it in their browser
- Rate limit requests — don't hammer a single domain
- If a page blocks automated access, try Jina Reader or suggest the user open it manually

Report findings clearly with source attribution.`,
  },
];
