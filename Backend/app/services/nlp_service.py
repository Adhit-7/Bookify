import re
import random
from collections import Counter
from typing import List, Dict, Tuple

class NLPService:
    @staticmethod
    def extract_keywords(text: str, top_n: int = 20) -> List[str]:
        """
        Extracts top keywords from text, excluding common Stopwords.
        """
        if not text:
            return []
            
        
        stopwords = {
            "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", 
            "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", 
            "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", 
            "an", "will", "my", "one", "all", "would", "there", "their", "what", 
            "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
            "when", "make", "can", "like", "time", "no", "just", "him", "know", 
            "take", "people", "into", "year", "your", "good", "some", "could", 
            "them", "see", "other", "than", "then", "now", "look", "only", "come", 
            "its", "over", "think", "also", "back", "after", "use", "two", "how", 
            "our", "work", "first", "well", "way", "even", "new", "want", "because", 
            "any", "these", "give", "day", "most", "us", "are", "is", "was", "were"
        }
        
        
        text = text.lower()
        words = re.findall(r'\b[a-z]{3,}\b', text) 
        
        
        filtered_words = [w for w in words if w not in stopwords]
        
        
        counter = Counter(filtered_words)
        return [word for word, count in counter.most_common(top_n)]

    @staticmethod
    def generate_summary(text: str, num_sentences: int = 3) -> str:
        """
        Generates an extractive summary by scoring sentences based on keyword frequency.
        """
        if not text:
            return ""
            
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
        keywords = NLPService.extract_keywords(text, top_n=50)
        
        sentence_scores = {}
        for sentence in sentences:
            word_count_in_sentence = len(sentence.split())
            if word_count_in_sentence < 5: 
                continue
                
            score = 0
            for word in keywords:
                if word in sentence.lower():
                    score += 1
            
            
            sentence_scores[sentence] = score / word_count_in_sentence
            
        
        sorted_sentences = sorted(sentence_scores.items(), key=lambda item: item[1], reverse=True)
        top_sentences = sorted_sentences[:num_sentences]
        
        
        
        
        
        return " ".join([s[0] for s in top_sentences])

    @staticmethod
    def generate_quiz(text: str, num_questions: int = 5) -> List[Dict]:
        """
        Generates quiz questions using the keyword extraction logic.
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.split()) > 5]
        
        if not sentences:
            return []

        keywords = NLPService.extract_keywords(text, top_n=100) 
        questions = []
        random.shuffle(sentences)

        for sentence in sentences:
            if len(questions) >= num_questions:
                break
            
            words = sentence.split()
            candidates = [w.strip(".,!?") for w in words if w.lower().strip(".,!?") in keywords]
            
            if not candidates:
                continue
                
            target_word = random.choice(candidates)
            
            
            question_text = sentence.replace(target_word, "_______")
            
            
            current_keywords = [k for k in keywords if k != target_word.lower()]
            if len(current_keywords) < 3:
                continue
                
            distractors = random.sample(current_keywords, 3)
            options = distractors + [target_word]
            random.shuffle(options)
            
            try:
                correct_index = options.index(target_word)
                questions.append({
                    "id": len(questions) + 1,
                    "question": question_text,
                    "options": options,
                    "correctAnswer": correct_index
                })
            except ValueError:
                continue
                
        return questions

    @staticmethod
    def compute_jaccard_similarity(keywords_a: List[str], keywords_b: List[str]) -> float:
        """
        Computes Jaccard similarity between two sets of keywords.
        Returns a float in [0, 1].
        """
        if not keywords_a or not keywords_b:
            return 0.0
        set_a = set(keywords_a)
        set_b = set(keywords_b)
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)
        return intersection / union if union > 0 else 0.0

    @staticmethod
    def rank_similar_books(
        target_keywords: List[str],
        all_books_keywords: List[Tuple[int, List[str]]],
        top_n: int = 4
    ) -> List[int]:
        """
        Given target book keywords and a list of (book_id, keywords) tuples,
        returns top_n most similar book_ids (excluding target itself).
        """
        scored = []
        for book_id, kws in all_books_keywords:
            score = NLPService.compute_jaccard_similarity(target_keywords, kws)
            scored.append((book_id, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [book_id for book_id, _ in scored[:top_n]]
