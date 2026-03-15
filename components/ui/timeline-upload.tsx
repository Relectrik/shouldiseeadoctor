"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Circle, CheckCircle2, Trash2 } from "lucide-react"

export type UploadFile = {
  id: string
  file: File
  progress: number
  status: "uploading" | "done"
}

interface TimelineUploadProps {
  files: UploadFile[]
  onRemove?: (id: string) => void
}

export function TimelineUpload({ files, onRemove }: TimelineUploadProps) {
  return (
    <div className="flex flex-col gap-6">
      {files.map((file, i) => (
        <div key={file.id} className="flex items-start gap-4">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            {file.status === "done" ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Circle className="h-6 w-6 text-blue-500" />
            )}
            {i !== files.length - 1 && (
              <div className="w-px flex-1 bg-muted" />
            )}
          </div>

          {/* File Card */}
          <Card className="w-full">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                {/* File/Folder Name */}
                <p className="flex min-w-0 flex-1 items-center gap-2 font-medium">
                  <span className="shrink-0">📄</span>
                  <span className="truncate" title={file.file.name}>
                    {file.file.name}
                  </span>
                </p>

                {/* Status and Remove */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {file.status === "done" ? "Completed" : "Uploading..."}
                  </span>
                  {onRemove && (
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={() => onRemove(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {file.status !== "done" && (
                <Progress value={file.progress} className="h-2" />
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
