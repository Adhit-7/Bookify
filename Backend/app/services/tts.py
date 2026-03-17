import edge_tts
import json
import os
import asyncio


VOICE_MAPPING = {
    "voice1": "en-US-AvaNeural",      
    "voice2": "en-US-AndrewNeural",   
    "voice3": "en-US-BrianNeural"     
}

async def generate_audio_from_text(text: str, output_path: str, voice_id: str = "voice1") -> bool:
    try:
        
        clean_text = text.replace('\n', ' ').strip()
        if not clean_text:
            return False

        
        voice = VOICE_MAPPING.get(voice_id, "en-US-AvaNeural")
        
        communicate = edge_tts.Communicate(clean_text, voice)
        
        
        
        audio_data = b""
        sentences = []
        words = []

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
            elif chunk["type"] == "SentenceBoundary":
                sentences.append({
                    "start": chunk["offset"] / 10_000_000,
                    "end": (chunk["offset"] + chunk["duration"]) / 10_000_000,
                    "text": chunk["text"]
                })
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "start": chunk["offset"] / 10_000_000,
                    "end": (chunk["offset"] + chunk["duration"]) / 10_000_000,
                    "text": chunk["text"]
                })

        
        
        alignment_data = sentences if sentences else words

        
        with open(output_path, "wb") as f:
            f.write(audio_data)
            
        
        alignment_path = output_path + ".json"
        with open(alignment_path, "w") as f:
            json.dump(alignment_data, f)
            
        return True

    except Exception as e:
        print(f"Error generating audio with edge-tts: {e}")
        return False
