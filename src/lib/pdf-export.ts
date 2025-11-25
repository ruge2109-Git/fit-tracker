/**
 * PDF Export Utility
 * Exports workouts to PDF format
 */

import { jsPDF } from 'jspdf'
import { WorkoutWithSets } from '@/types'
import { formatDate, formatDuration, formatWeight } from '@/lib/utils'

export function exportWorkoutToPDF(workout: WorkoutWithSets, locale: string = 'en') {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }
  }

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const title = workout.routine_name || 'Workout'
  doc.text(title, margin, yPosition)
  yPosition += 10

  // Date and Duration
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${formatDate(workout.date, 'PPP')}`, margin, yPosition)
  yPosition += 7
  doc.text(`Duration: ${formatDuration(workout.duration)}`, margin, yPosition)
  yPosition += 10

  // Notes
  if (workout.notes) {
    checkNewPage(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', margin, yPosition)
    yPosition += 7
    doc.setFont('helvetica', 'normal')
    const notesLines = doc.splitTextToSize(workout.notes, pageWidth - 2 * margin)
    doc.text(notesLines, margin, yPosition)
    yPosition += notesLines.length * 7 + 5
  }

  // Exercises
  checkNewPage(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Exercises', margin, yPosition)
  yPosition += 10

  // Group sets by exercise
  const exerciseGroups = workout.sets.reduce((acc, set) => {
    const exerciseName = set.exercise.name
    if (!acc[exerciseName]) {
      acc[exerciseName] = []
    }
    acc[exerciseName].push(set)
    return acc
  }, {} as Record<string, typeof workout.sets>)

  // Add each exercise
  Object.entries(exerciseGroups).forEach(([exerciseName, sets]) => {
    checkNewPage(25)
    
    // Exercise name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(exerciseName, margin, yPosition)
    yPosition += 8

    // Table header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const tableStartY = yPosition
    doc.text('Set', margin, yPosition)
    doc.text('Reps', margin + 30, yPosition)
    doc.text('Weight', margin + 60, yPosition)
    doc.text('Rest', margin + 90, yPosition)
    doc.text('Volume', margin + 120, yPosition)
    yPosition += 7

    // Draw line
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
    yPosition += 3

    // Sets
    doc.setFont('helvetica', 'normal')
    sets.forEach((set, index) => {
      checkNewPage(10)
      const volume = (set.weight * set.reps).toFixed(1)
      doc.text(`${index + 1}`, margin, yPosition)
      doc.text(`${set.reps}`, margin + 30, yPosition)
      doc.text(formatWeight(set.weight), margin + 60, yPosition)
      doc.text(set.rest_time ? `${set.rest_time}s` : '-', margin + 90, yPosition)
      doc.text(`${volume} kg`, margin + 120, yPosition)
      yPosition += 7
    })

    // Exercise total
    checkNewPage(10)
    const totalVolume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Volume: ${totalVolume.toFixed(1)} kg`, margin + 60, yPosition)
    yPosition += 10
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    )
  }

  // Save PDF
  const fileName = `${workout.routine_name || 'workout'}_${formatDate(workout.date, 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}

