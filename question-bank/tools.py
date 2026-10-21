"""Offline authoring tools. No network calls; never imported by the web application."""
import argparse
from collections import Counter
from copy import deepcopy
import json
from pathlib import Path
import re

BANK_PATH = Path(__file__).with_name('bank.v1.json')
ID = re.compile(r'^[a-z][a-z0-9.-]*$')


def load_bank():
    return json.loads(BANK_PATH.read_text(encoding='utf-8'))


def validate(bank):
    """Check referential integrity and assessment-specific content invariants."""
    errors = []
    def require(condition, message):
        if not condition:
            errors.append(message)
    require(bank.get('schemaVersion') == 1, 'Unsupported schema version')
    require(bank.get('locale') == 'id-ID', 'Expected Indonesian locale')
    sources = {s['id'] for s in bank['sources']}
    topics = {t['id']: t for t in bank['topics']}
    require(len(topics) == len(bank['topics']), 'Duplicate topic IDs')
    seen = set()
    for topic in bank['topics']:
        tid = topic['id']
        require(bool(ID.fullmatch(tid)), f'{tid}: invalid topic ID')
        require(bool(topic['title'].strip()), f'{tid}: missing title')
        require(topic['phase'] in {'foundation', 'E', 'F', 'F-advanced'}, f'{tid}: invalid phase')
        expected_track = {'foundation': 'foundation', 'E': 'general', 'F': 'general', 'F-advanced': 'advanced'}.get(topic['phase'])
        require(topic['track'] == expected_track, f'{tid}: inconsistent track')
        require(len(topic['prerequisites']) == len(set(topic['prerequisites'])), f'{tid}: duplicate prerequisite')
        for prerequisite in topic['prerequisites']:
            # An earlier topic is required: also rejects cycles and self-links.
            require(prerequisite in seen, f'{tid}: prerequisite {prerequisite} must exist earlier')
        require(topic['alignment']['sourceId'] in sources, f'{tid}: unknown curriculum source')
        require(bool(topic['alignment']['section'].strip()), f'{tid}: missing alignment section')
        seen.add(tid)
    seen_questions = set()
    seen_prompts = set()
    levels = {tid: set() for tid in topics}
    for question in bank['questions']:
        qid = question['id']
        require(qid not in seen_questions, f'{qid}: duplicate question ID')
        seen_questions.add(qid)
        require(bool(ID.fullmatch(qid)), f'{qid}: invalid question ID')
        tid = question['topicId']
        require(tid in topics, f'{qid}: unknown topic')
        require(question['skillId'].startswith(tid + '.'), f'{qid}: skill outside topic namespace')
        require(question['version'] >= 1, f'{qid}: invalid content version')
        require(question['difficulty'] in {1, 2, 3}, f'{qid}: invalid difficulty')
        require(question['difficultyStatus'] == 'provisional', f'{qid}: uncalibrated difficulty must remain provisional')
        require(question['reviewStatus'] in {'draft', 'reviewed'}, f'{qid}: invalid review state')
        require(question['format'] == 'single-choice', f'{qid}: unsupported format')
        if tid in levels:
            levels[tid].add(question['difficulty'])
        prompt = ' '.join(question['prompt'].split())
        require(bool(prompt) and prompt not in seen_prompts, f'{qid}: empty or repeated prompt')
        seen_prompts.add(prompt)
        require(len(question['options']) == 4, f'{qid}: expected four options')
        ids = [o['id'] for o in question['options']]
        texts = [' '.join(o['text'].split()) for o in question['options']]
        require(ids == ['a', 'b', 'c', 'd'], f'{qid}: unstable option IDs')
        require(len(set(texts)) == 4 and all(texts), f'{qid}: empty or duplicate option text')
        correct = question['answer']['optionId']
        require(correct in ids, f'{qid}: answer is not an option')
        distractor_ids = [d['optionId'] for d in question['distractors']]
        require(len(distractor_ids) == 3 and set(distractor_ids) == set(ids) - {correct}, f'{qid}: distractor coverage must exclude correct answer')
        require(all(ID.fullmatch(d['misconception']) for d in question['distractors']), f'{qid}: invalid misconception tag')
        require(len(question['explanation'].strip()) >= 30, f'{qid}: missing useful explanation')
    for tid, present in levels.items():
        require(present == {1, 2, 3}, f'{tid}: missing difficulty tier')
    return errors


def public_question(question):
    """Reference allowlist for a backend response; answer data stays server-side."""
    return {
        key: deepcopy(question[key])
        for key in ('id', 'version', 'topicId', 'skillId', 'format', 'prompt', 'options')
    }


def review_markdown(bank):
    lines = ['# ReThink question bank — review copy', '',
             'Generated from `bank.v1.json` with `python3 question-bank/tools.py review`.', '',
             '**Draft content.** Answers are included for reviewers. Difficulty is provisional; misconception tags are hypotheses, not diagnoses.', '']
    for topic in bank['topics']:
        lines += [f"## {topic['title']}", '', f"`{topic['id']}` · {topic['phase']} · {topic['track']}", '']
        for q in (q for q in bank['questions'] if q['topicId'] == topic['id']):
            lines += [f"### {q['id']} · Level {q['difficulty']}", '', q['prompt'], '']
            lines += [f"- **{o['id'].upper()}.** {o['text']}" for o in q['options']]
            lines += ['', f"**Jawaban: {q['answer']['optionId'].upper()}.** {q['explanation']}", '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('validate', 'review'))
    parser.add_argument('--output', type=Path, help='Optional review Markdown destination')
    args = parser.parse_args()
    bank = load_bank()
    errors = validate(bank)
    if errors:
        raise SystemExit('\n'.join(errors))
    if args.command == 'review':
        review = review_markdown(bank)
        if args.output:
            args.output.write_text(review, encoding='utf-8')
        else:
            print(review)
    else:
        counts = Counter(t['phase'] for t in bank['topics'])
        print(f"Validated {len(bank['questions'])} questions / {len(bank['topics'])} topics: {dict(counts)}")


if __name__ == '__main__':
    main()
