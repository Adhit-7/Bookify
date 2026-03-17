import { useState, useCallback } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Upload as UploadIcon, FileText, X, Mic2, Check } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";



const voiceOptions = [
  { id: "en-us-female", name: "English (US) - Female", language: "en", gender: "female", description: "Clear American accent", accent: "North American" },
  { id: "en-us-male", name: "English (US) - Male", language: "en", gender: "male", description: "Deep American voice", accent: "North American" },
  { id: "en-uk-female", name: "English (UK) - Female", language: "en-uk", gender: "female", description: "British accent", accent: "British" },
  { id: "en-au-female", name: "English (AU) - Female", language: "en-au", gender: "female", description: "Australian accent", accent: "Australian" },
];

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    
    
    if (!selectedVoice) {
      toast.error("Please select a voice");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      formData.append("title", file.name.replace(".pdf", ""));
      formData.append("author", "Unknown Author"); 

      const response = await api.post("/books/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      const bookId = response.data.id;
      toast.success("Book uploaded successfully! Generating audio...");

      
      await api.post(`/books/${bookId}/audio`);
      toast.success("Audio generated ready for listening!");

      setFile(null);
      setSelectedVoice(null);
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Upload Your <span className="text-gradient">Book</span>
            </h1>
            <p className="text-muted-foreground">
              Transform any PDF into an AI-powered audiobook experience
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${dragActive
                ? "border-primary bg-primary/5"
                : file
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/50"
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <UploadIcon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    Drag & drop your PDF here
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    or click to browse from your device
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mic2 className="h-5 w-5 text-primary" />
              Choose AI Voice
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {voiceOptions.map((voice) => (
                <motion.button
                  key={voice.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`relative p-6 rounded-xl border-2 text-left transition-all duration-300 ${selectedVoice === voice.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                    }`}
                >
                  {selectedVoice === voice.id && (
                    <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-primary">{voice.name[0]}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground">{voice.name}</h3>
                  <p className="text-sm text-muted-foreground">{voice.description}</p>
                  <p className="text-xs text-primary mt-1">{voice.accent}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Button
              variant="hero"
              size="xl"
              onClick={handleUpload}
              disabled={!file || !selectedVoice || isUploading}
              className="min-w-[200px]"
            >
              {isUploading ? (
                <>
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5" />
                  Create Audiobook
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Upload;
