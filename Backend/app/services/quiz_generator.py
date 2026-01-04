import random
import re

def generate_quiz_from_text(text: str, num_questions: int = 5):
    """
    Generates a simple quiz by extracting sentences and blanking out keywords.
    """
    if not text:
        return []

    
    text = text.replace('\n', ' ')
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.split()) > 5] 
    
    if not sentences:
        return []

    questions = []
    
    
    all_words = list(set(re.findall(r'\b[A-Za-z]{5,}\b', text))) 
    
    
    random.shuffle(sentences)
    
    for sentence in sentences:
        if len(questions) >= num_questions:
            break
            
        words = sentence.split()
        
        candidates = [w for w in words if len(w.strip(".,!?")) > 4]
        if not candidates:
            continue
            
        target_word = random.choice(candidates)
        clean_target = target_word.strip(".,!?")
        
        
        question_text = sentence.replace(target_word, "_______")
        
        
        distractors = random.sample([w for w in all_words if w != clean_target], min(3, len(all_words)-1))
        options = distractors + [clean_target]
        random.shuffle(options)
        
        try:
            correct_index = options.index(clean_target)
        except ValueError:
            continue
            
        questions.append({
            "id": len(questions) + 1,
            "question": question_text,
            "options": options,
            "correctAnswer": correct_index
        })
        
    return questions
