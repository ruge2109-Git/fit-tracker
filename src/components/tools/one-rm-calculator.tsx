/**
 * One Rep Max Calculator
 * Calculate estimated 1RM using various formulas
 */

'use client'

import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function OneRMCalculator() {
  const [weight, setWeight] = useState<number>(100)
  const [reps, setReps] = useState<number>(5)
  const [oneRM, setOneRM] = useState<number | null>(null)

  // Different 1RM formulas
  const calculateOneRM = () => {
    if (!weight || !reps || reps < 1) return

    // Epley Formula (most common)
    const epley = weight * (1 + reps / 30)
    
    // Brzycki Formula
    const brzycki = weight * (36 / (37 - reps))
    
    // Lander Formula
    const lander = (100 * weight) / (101.3 - 2.67123 * reps)
    
    // Lombardi Formula
    const lombardi = weight * Math.pow(reps, 0.10)
    
    // Mayhew Formula
    const mayhew = (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps))
    
    // Average of all formulas
    const average = (epley + brzycki + lander + lombardi + mayhew) / 5
    
    setOneRM(Math.round(average))
  }

  const calculatePercentages = () => {
    if (!oneRM) return []
    
    return [
      { percent: 95, weight: Math.round(oneRM * 0.95), reps: '1-2' },
      { percent: 90, weight: Math.round(oneRM * 0.90), reps: '2-4' },
      { percent: 85, weight: Math.round(oneRM * 0.85), reps: '4-6' },
      { percent: 80, weight: Math.round(oneRM * 0.80), reps: '5-8' },
      { percent: 75, weight: Math.round(oneRM * 0.75), reps: '8-10' },
      { percent: 70, weight: Math.round(oneRM * 0.70), reps: '10-12' },
      { percent: 65, weight: Math.round(oneRM * 0.65), reps: '12-15' },
      { percent: 60, weight: Math.round(oneRM * 0.60), reps: '15+' },
    ]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <CardTitle>1RM Calculator</CardTitle>
        </div>
        <CardDescription>Calculate your one-rep max and training percentages</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="percentages" disabled={!oneRM}>Percentages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight Lifted (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  min="1"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps Performed</Label>
                <Input
                  id="reps"
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <Button onClick={calculateOneRM} className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Calculate 1RM
            </Button>

            {oneRM && (
              <div className="text-center p-6 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Estimated 1RM</p>
                <p className="text-4xl font-bold text-primary">{oneRM} kg</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {weight}kg × {reps} reps
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Note: This is an estimate. Actual 1RM may vary. Most accurate for 1-10 reps.
            </p>
          </TabsContent>

          <TabsContent value="percentages">
            {oneRM && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Training percentages based on your estimated 1RM of <span className="font-bold text-foreground">{oneRM}kg</span>
                </p>
                <div className="space-y-2">
                  {calculatePercentages().map((item) => (
                    <div
                      key={item.percent}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold w-12">{item.percent}%</span>
                        <span className="text-2xl font-bold text-primary">{item.weight} kg</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.reps} reps</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Use these percentages to plan your training sets
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

