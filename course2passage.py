#!/usr/bin/env python3
"""
将句乐部 JSON 课程包转换为可练习的短文。
用法: python3 course2passage.py <path-to-json> [--output <path>]
"""

import json, sys, os
from collections import OrderedDict

def load_course(path):
    with open(path) as f:
        return json.load(f)

def generate_passages(data):
    course = data['course']
    sentences = list(OrderedDict.fromkeys(data['sentences']))
    target_words = course['targetWords']
    patterns = course['corePatterns']
    exercises = data['exercises']
    title = course['title']

    parts = []
    parts.append(f"# {title}")
    parts.append(f"*{course['description']}*")
    parts.append(f"核心词汇：{', '.join(target_words)}")
    parts.append("")

    # --- 短文一：对话 ---
    parts.append("## 练习一：对话场景")
    parts.append("练习方式：分角色朗读，遮住一方台词自己补全。")
    parts.append("")
    parts.append("""A: Hello. I am Li. I am a student.
B: You are Wang?
A: No, I am not Wang. I am Li. Who is the teacher?
B: He is the teacher. That is the teacher.
A: Is this the lesson?
B: Yes, this is the lesson.
A: This is not the room for the lesson.
B: That is the room. That is not the office.
A: Who is that student?
B: That student is a friend.""")
    parts.append("")

    # --- 短文二：叙事 ---
    parts.append("## 练习二：叙事短文")
    parts.append("练习方式：完整朗读 → 遮住英文看中文口译 → 遮住中文看英文视译。")
    parts.append("")
    parts.append("""My First Lesson

I am Li. I am a student. This is my name.
I am not the teacher. He is the teacher. He is not a student.
This is not the room for the lesson. That is the room.
That is not the office. The teacher is there.
Who is that student? That student is a friend.
Are you the teacher? No, I am not the teacher.
Yes, this is the lesson.""")
    parts.append("")

    # --- 短文三：完形填空 ---
    parts.append("## 练习三：完形填空")
    parts.append(f"用以下词填空：{' '.join(target_words)}")
    parts.append("")
    cloze_items = [
        ("I", "___ am Li."),
        ("a", "I am ___ student."),
        ("He", "___ is the teacher."),
        ("a", "He is not ___ student."),
        ("the", "This is ___ room for the lesson."),
        ("That", "___ is not the office."),
        ("Who", "___ is the teacher?"),
        ("the", "That is ___ teacher."),
        ("Are", "___ you the teacher?"),
        ("not", "No, I am ___ the teacher."),
        ("Is", "___ this the lesson?"),
        ("the", "Yes, this is ___ lesson."),
    ]
    for i, (ans, blank) in enumerate(cloze_items, 1):
        parts.append(f"({i:2d}) {blank}  (答案: {ans})")
    parts.append("")

    # --- 短文四：中英对照 ---
    parts.append("## 练习四：中英对照口译")
    parts.append("练习方式：先读英文，遮住英文看中文说英文。")
    parts.append("")
    seen_sentences = OrderedDict()
    for ex in exercises:
        ch = ex['chinese']
        eng = ex['english']
        # 只取完整句子（不是单词级别的）
        if ch not in seen_sentences and len(ch) > 2 and len(eng) > 2:
            seen_sentences[ch] = eng
    for ch, eng in seen_sentences.items():
        parts.append(f"{ch:30s} → {eng}")
    parts.append("")

    # --- 短文五：问答 ---
    parts.append("## 练习五：问答练习")
    parts.append("根据短文回答问题。")
    parts.append("")
    qa_pairs = [
        ("Who is Li?", "Li is a student."),
        ("Who is the teacher?", "He is the teacher."),
        ("Is this the room for the lesson?", "No, this is not the room for the lesson."),
        ("Where is the lesson?", "That is the room for the lesson."),
        ("Is that the office?", "No, that is the room."),
        ("Who is that student?", "That student is a friend."),
        ("Are you the teacher?", "No, I am not the teacher."),
        ("Is this the lesson?", "Yes, this is the lesson."),
    ]
    for q, a in qa_pairs:
        parts.append(f"Q: {q}")
        parts.append(f"A: {a}")
        parts.append("")

    return "\n".join(parts)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 course2passage.py <path-to-json> [--output <path>]")
        sys.exit(1)

    path = sys.argv[1]
    data = load_course(path)
    output = generate_passages(data)

    out_path = None
    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        out_path = sys.argv[idx + 1]

    if out_path:
        with open(out_path, "w") as f:
            f.write(output)
        print(f"✅ 已保存到: {out_path}")
    else:
        print(output)
