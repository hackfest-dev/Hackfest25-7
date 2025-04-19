
import React from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentUploaderProps {
  onContentExtracted: (content: string, fileName: string, fileType: string) => void;
  isAnalyzing: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onContentExtracted,
  isAnalyzing 
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document using PDF.js
      const loadingTask = pdfjs.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      console.log(`PDF loaded with ${pdf.numPages} pages`);
      
      let extractedText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        setUploadProgress(Math.floor((i / pdf.numPages) * 100));
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Join all the text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += pageText + '\n\n';
      }
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      toast.error('Failed to extract text from PDF');
      return '';
    }
  };

  const extractTextFromDocx = async (docxFile: File): Promise<string> => {
    // For DOCX files we would need a library like mammoth.js
    // This is a simplified placeholder
    toast.warning('DOCX extraction is limited. For best results, use PDF files.');
    return await docxFile.text();
  };

  const extractTextFromTxt = async (txtFile: File): Promise<string> => {
    return await txtFile.text();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile) {
      let extractedText = '';
      // Migrate: Upload file to Firebase Storage
      try {
        const { storage } = await import('../../firebase');
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const storageRef = ref(storage, `uploads/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        const downloadUrl = await getDownloadURL(storageRef);
        // Extract text from file (PDF, DOCX, TXT, fallback)
        if (selectedFile.type === 'application/pdf') {
          toast.info('Extracting text from PDF...');
          extractedText = await extractTextFromPdf(selectedFile);
        } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          toast.info('Extracting text from DOCX...');
          extractedText = await extractTextFromDocx(selectedFile);
        } else if (selectedFile.type === 'text/plain') {
          extractedText = await extractTextFromTxt(selectedFile);
        } else {
          try {
            extractedText = await selectedFile.text();
          } catch (error) {
            toast.error('Unsupported file format. Please upload PDF, DOCX, or TXT files.');
            return;
          }
        }
        // Clean up the text
        if (extractedText) {
          extractedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }
        // Real-time AI analysis: POST to FastAPI
        let aiResult = null;
        if (extractedText) {
          try {
            const user = (await import('../../firebase')).auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            const idToken = await user.getIdToken();
            const response = await fetch('http://localhost:5001/api/analyze-compliance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                document_text: extractedText,
                document_name: selectedFile.name,
                document_type: selectedFile.type || 'text/plain',
                file_url: downloadUrl
              })
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error from AI API: ${response.status}`);
            }
            aiResult = await response.json();
          } catch (error) {
            console.error('AI analysis failed:', error);
            toast.error('AI analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
          }
        }
        // Pass extracted text and file info up to parent (AI result can be handled separately if needed)
        onContentExtracted(extractedText, selectedFile.name, selectedFile.type);
        // Optionally, you could provide a separate callback or state update for the AI result
      } catch (error) {
        console.error('Error uploading to Firebase Storage:', error);
        toast.error('Failed to upload file to Firebase Storage');
      }

      setUploadProgress(0);
      try {
        let extractedText = '';
        
        if (selectedFile.type === 'application/pdf') {
          toast.info('Extracting text from PDF...');
          extractedText = await extractTextFromPdf(selectedFile);
        } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          toast.info('Extracting text from DOCX...');
          extractedText = await extractTextFromDocx(selectedFile);
        } else if (selectedFile.type === 'text/plain') {
          extractedText = await extractTextFromTxt(selectedFile);
        } else {
          try {
            // Fallback to treating as text
            extractedText = await selectedFile.text();
          } catch (error) {
            toast.error('Unsupported file format. Please upload PDF, DOCX, or TXT files.');
            return;
          }
        }
        
        // Process the extracted text and pass it up
        if (extractedText) {
          // Clean up the text - remove excess whitespace, normalize line breaks
          extractedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          
          onContentExtracted(extractedText, selectedFile.name, selectedFile.type);
        }
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Failed to process the document');
      } finally {
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <Upload className="h-10 w-10 text-gray-400" />
      </div>
      <p className="text-sm text-gray-600 mb-2">
        Drag and drop your loan agreement, or
      </p>
      <label htmlFor="file-upload" className="cursor-pointer">
        <span className="inline-block bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">
          Browse files
        </span>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
        />
      </label>
      
      {uploadProgress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Processing: {uploadProgress}%</p>
        </div>
      )}
      
      {file && uploadProgress === 0 && (
        <div className="mt-4 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary mr-2" />
          <span className="text-sm font-medium">{file.name}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
