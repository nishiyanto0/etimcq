import pdfplumber
import json
import re
import os

PDF_PATH = r'E:\mcq web\V2V_ETI_MCQs.pdf'
OUTPUT_DIR = r'E:\mcq web\data'

os.makedirs(OUTPUT_DIR, exist_ok=True)

UNIT_NAMES = {
    1: "Artificial Intelligence",
    2: "Internet of Things (IoT) & 5G",
    3: "Blockchain Technology",
    4: "Immersive Technology",
    5: "Digital Forensics & Cybersecurity"
}

SKIP_PATTERNS = [
    r'Mob No\s*:', r'Youtube\s*:', r'Insta\s*:', r'App Link',
    r'V2V\s*Ed', r'ETI\s*\(CO', r'\| Notes', r'\| MCQs',
    r'^__PAGE_', r'9326050669', r'9372072139', r'@v2vedtechllp',
    r'v2vedtech'
]

def is_skip_line(line):
    for pat in SKIP_PATTERNS:
        if re.search(pat, line, re.IGNORECASE):
            return True
    return False

def clean_text(text):
    """Fix common PDF encoding issues."""
    text = text.replace('\u2019', "'").replace('\u2018', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2013', '-').replace('\u2014', '-')
    text = text.replace('\ufffd', "'").replace('\u00e2\u0080\u0099', "'")
    # Fix the garbled header pattern like "V2VV 2EVd ETdeTcehc"
    text = re.sub(r'V2VV\s+2EVd\s+ETdeTcehc.*', '', text)
    return text

def extract_page_texts(pdf):
    page_texts = {}
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            page_texts[i + 1] = clean_text(text)
    return page_texts

def find_unit_ranges(page_texts, total_pages):
    unit_page_ranges = {}
    unit_pattern = re.compile(r'^\s*UNIT\s+(\d+)', re.IGNORECASE)
    current_unit = None
    unit_start_page = None

    for page_num in sorted(page_texts.keys()):
        text = page_texts[page_num]
        for line in text.split('\n'):
            line = line.strip()
            u_match = unit_pattern.match(line)
            if u_match:
                new_unit = int(u_match.group(1))
                if current_unit is not None:
                    unit_page_ranges[current_unit] = (unit_start_page, page_num - 1)
                current_unit = new_unit
                unit_start_page = page_num
                break

    if current_unit is not None:
        unit_page_ranges[current_unit] = (unit_start_page, total_pages)

    return unit_page_ranges

def parse_unit_questions(unit_text):
    """
    Robust parser handling multiple answer formats:
    Format A: Answer: b) Text  (on same line, directly after options)
    Format B: Answer:\nb) Text  (answer keyword alone, then answer on next line)
    Both may be followed by Explanation: ... text
    """
    # First, clean and split into meaningful lines
    raw_lines = unit_text.split('\n')
    lines = []
    for line in raw_lines:
        line = line.strip()
        if not line:
            continue
        if is_skip_line(line):
            continue
        lines.append(line)

    questions = []

    # State machine
    Q_IDLE = 'idle'
    Q_QUESTION = 'question'
    Q_OPTIONS = 'options'
    Q_ANSWER_KEYWORD = 'answer_keyword'  # saw "Answer:" alone
    Q_ANSWER = 'answer'
    Q_EXPLANATION = 'explanation'

    state = Q_IDLE
    q_num = None
    q_text = []
    options = []
    answer_raw = None
    explanation_lines = []

    q_pat = re.compile(r'^(\d+)\.\s*(.*)')
    opt_pat = re.compile(r'^([a-dA-D])\s*[)\.]?\s*(.*)')  # flexible: a) or a. or a)
    ans_inline_pat = re.compile(r'^Answer\s*:\s*([a-dA-D])\s*[)\.]?\s*(.*)', re.IGNORECASE)
    ans_keyword_pat = re.compile(r'^Answer\s*:\s*$', re.IGNORECASE)
    ans_only_pat = re.compile(r'^([a-dA-D])\s*[)\.]?\s*(.*)')  # after Answer: keyword
    expl_pat = re.compile(r'^Explanation\s*:\s*(.*)', re.IGNORECASE)

    def flush_question():
        nonlocal q_text, options, answer_raw, explanation_lines, q_num
        if not q_text or not answer_raw:
            q_text, options, answer_raw, explanation_lines, q_num = [], [], None, [], None
            return

        full_q = ' '.join(q_text).strip()
        
        # Parse answer
        ans_match = re.match(r'([a-dA-D])\s*[)\.]?\s*(.*)', answer_raw.strip())
        if not ans_match:
            q_text, options, answer_raw, explanation_lines, q_num = [], [], None, [], None
            return

        correct_letter = ans_match.group(1).lower()
        letter_to_idx = {'a': 0, 'b': 1, 'c': 2, 'd': 3}
        correct_idx = letter_to_idx.get(correct_letter, 0)

        # Clean options
        opts_clean = []
        for opt in options:
            m = re.match(r'^([a-dA-D])\s*[)\.]?\s*(.*)', opt)
            if m:
                opts_clean.append(m.group(2).strip())

        # Need at least 2 options to be valid
        if len(opts_clean) < 2:
            q_text, options, answer_raw, explanation_lines, q_num = [], [], None, [], None
            return

        # Pad if fewer than 4 options (rare malformed questions)
        while len(opts_clean) < 4:
            opts_clean.append("")

        correct_text = opts_clean[correct_idx] if correct_idx < len(opts_clean) else ans_match.group(2).strip()

        explanation = ' '.join(explanation_lines).strip()
        if not explanation:
            explanation = f"The correct answer is '{correct_text}'. This follows the standard concepts covered in this unit."

        questions.append({
            "question": full_q,
            "options": opts_clean[:4],
            "correct": correct_idx,
            "correctText": correct_text,
            "explanation": explanation
        })

        q_text, options, answer_raw, explanation_lines, q_num = [], [], None, [], None

    for line in lines:
        # Check for new question number (always resets state)
        q_match = q_pat.match(line)
        if q_match:
            # If we were building a previous question, save it
            if state in (Q_ANSWER, Q_EXPLANATION, Q_OPTIONS) and q_text:
                flush_question()
            state = Q_QUESTION
            q_num = int(q_match.group(1))
            rest = q_match.group(2).strip()
            q_text = [rest] if rest else []
            options = []
            answer_raw = None
            explanation_lines = []
            continue

        # Skip unit header lines
        if re.match(r'^UNIT\s+\d+', line, re.IGNORECASE):
            continue

        if state == Q_QUESTION:
            # Look for first option
            opt_m = opt_pat.match(line)
            if opt_m and opt_m.group(1).lower() == 'a':
                state = Q_OPTIONS
                options.append(line)
            elif ans_inline_pat.match(line):
                # Question with no visible options? Skip to answer
                state = Q_ANSWER
                m = ans_inline_pat.match(line)
                answer_raw = m.group(1) + ') ' + m.group(2)
            elif ans_keyword_pat.match(line):
                state = Q_ANSWER_KEYWORD
            else:
                # Continuation of question text
                q_text.append(line)

        elif state == Q_OPTIONS:
            # Check for inline answer
            m_inline = ans_inline_pat.match(line)
            if m_inline:
                state = Q_ANSWER
                answer_raw = m_inline.group(1) + ') ' + m_inline.group(2)
                continue
            # Check for answer keyword alone
            if ans_keyword_pat.match(line):
                state = Q_ANSWER_KEYWORD
                continue
            # Another option
            opt_m = opt_pat.match(line)
            if opt_m and opt_m.group(1).lower() in 'abcd':
                options.append(line)
            else:
                # Might be continuation of last option
                if options:
                    options[-1] += ' ' + line

        elif state == Q_ANSWER_KEYWORD:
            # Next non-empty line should be the actual answer
            opt_m = ans_only_pat.match(line)
            if opt_m and opt_m.group(1).lower() in 'abcd':
                answer_raw = line
                state = Q_ANSWER
            else:
                # Edge case: still more content
                state = Q_ANSWER
                answer_raw = line

        elif state == Q_ANSWER:
            # Check for explanation
            expl_m = expl_pat.match(line)
            if expl_m:
                state = Q_EXPLANATION
                rest = expl_m.group(1).strip()
                if rest:
                    explanation_lines.append(rest)
            else:
                # Might be continuation or new question (handled at top)
                pass

        elif state == Q_EXPLANATION:
            # Check for inline answer on explanation line (shouldn't happen but be safe)
            expl_m = expl_pat.match(line)
            if expl_m:
                rest = expl_m.group(1).strip()
                if rest:
                    explanation_lines.append(rest)
            else:
                explanation_lines.append(line)

    # Flush last question
    if state in (Q_OPTIONS, Q_ANSWER, Q_EXPLANATION, Q_ANSWER_KEYWORD) and q_text:
        flush_question()

    return questions

def main():
    print("Opening PDF...")
    with pdfplumber.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")

        page_texts = extract_page_texts(pdf)
        unit_ranges = find_unit_ranges(page_texts, total_pages)

        print("\nDetected unit page ranges:")
        for u, (s, e) in sorted(unit_ranges.items()):
            print(f"  Unit {u}: Pages {s} - {e}")

        for unit_num, (start_page, end_page) in sorted(unit_ranges.items()):
            print(f"\nProcessing Unit {unit_num} ({UNIT_NAMES.get(unit_num, '')}) pages {start_page}-{end_page}...")

            combined = "\n".join(
                page_texts[pg] for pg in range(start_page, end_page + 1) if pg in page_texts
            )

            questions = parse_unit_questions(combined)
            print(f"  Found {len(questions)} questions")

            unit_data = {
                "unit": unit_num,
                "name": UNIT_NAMES.get(unit_num, f"Unit {unit_num}"),
                "totalQuestions": len(questions),
                "questions": questions
            }

            out_path = os.path.join(OUTPUT_DIR, f"unit_{unit_num}.json")
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(unit_data, f, indent=2, ensure_ascii=False)
            print(f"  Saved: {out_path}")

    print("\nAll units processed!")

if __name__ == "__main__":
    main()
