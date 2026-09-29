import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadPaper } from '../utils/api'

function UploadZone({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await uploadPaper(file, 'Student')
      
      setSuccess(true)
      setTimeout(() => {
        onUploadSuccess(response)
      }, 1000)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading || success
  })

  return (
    <div className="w-full max-w-2xl">
      <div
        {...getRootProps()}
        className={`relative group p-12 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragActive
            ? 'border-blue-400 bg-blue-500/10 scale-105'
            : uploading
            ? 'border-yellow-400 bg-yellow-500/10'
            : success
            ? 'border-green-400 bg-green-500/10'
            : error
            ? 'border-red-400 bg-red-500/10'
            : 'border-slate-600 bg-slate-800/50 hover:border-blue-400 hover:bg-slate-800/70 hover:scale-105'
        }`}
      >
        <input {...getInputProps()} />
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative flex flex-col items-center space-y-4">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400"></div>
              <p className="text-lg font-semibold text-yellow-400">Uploading...</p>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 animate-bounce" />
              <p className="text-lg font-semibold text-green-400">Upload Successful!</p>
              <p className="text-sm text-slate-400">Redirecting to analysis...</p>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-16 h-16 text-red-400" />
              <p className="text-lg font-semibold text-red-400">Upload Failed</p>
              <p className="text-sm text-slate-400">{error}</p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <Upload className="w-16 h-16 text-blue-400 animate-bounce" />
              ) : (
                <FileText className="w-16 h-16 text-slate-400 group-hover:text-blue-400 transition-colors duration-300" />
              )}
              
              <div className="text-center">
                <p className="text-xl font-semibold text-slate-200 mb-2">
                  {isDragActive ? 'Drop your paper here' : 'Upload Research Paper'}
                </p>
                <p className="text-sm text-slate-400">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Supports PDF, DOCX, TXT
                </p>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span>Backend Connected</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {!error && !success && !uploading && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            📄 Your paper will be analyzed through 4 AI modules
          </p>
          <div className="flex justify-center items-center space-x-4 mt-3 text-xs text-slate-500">
            <span>✓ Related Work</span>
            <span>✓ Novelty Check</span>
            <span>✓ Weaknesses</span>
            <span>✓ Clarity</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadZone
