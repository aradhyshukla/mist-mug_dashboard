// Mist & Mug — Sales Dashboard
// File drop zone component for sales import.

import { useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface FileDropZoneProps {
  acceptedExtensions: string[]
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export function FileDropZone({
  acceptedExtensions,
  onFileSelected,
  disabled = false,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && !disabled) {
      onFileSelected(f)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && !disabled) {
      onFileSelected(f)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors w-full max-w-md",
        disabled
          ? "bg-cream border-border opacity-60 pointer-events-none"
          : "bg-cream border-border hover:bg-gold/5"
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest mb-3">
        <Upload className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="font-serif font-semibold text-ink">
        {disabled ? "Import complete" : "Drop a sales file here"}
      </p>
      <p className="text-xs text-wood/60">
        {acceptedExtensions.join(" · ").toUpperCase()}
      </p>
      <Button onClick={() => inputRef.current?.click()} variant="default" disabled={disabled}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        id="file-input"
        type="file"
        accept={acceptedExtensions.map((e) => `.${e}`).join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
