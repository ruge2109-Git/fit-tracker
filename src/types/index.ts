/**
 * Core domain types for the FitTrackr application
 * Following Interface Segregation Principle - small, focused interfaces
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  name: string;
}

export interface UserProfile extends User {
  total_workouts?: number;
  total_exercises?: number;
  member_since?: string;
}

// Workout types
export interface Workout extends BaseEntity {
  user_id: string;
  date: string;
  duration: number; // in minutes
  notes?: string;
  routine_id?: string; // Optional reference to routine template
  routine_name?: string; // Name of the routine (populated via join)
}

export interface WorkoutWithSets extends Workout {
  sets: SetWithExercise[];
}

// Exercise types
export enum ExerciseType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  MOBILITY = 'mobility',
  FLEXIBILITY = 'flexibility',
}

export enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  LEGS = 'legs',
  SHOULDERS = 'shoulders',
  ARMS = 'arms',
  CORE = 'core',
  FULL_BODY = 'full_body',
  CARDIO = 'cardio',
}

export interface Exercise extends BaseEntity {
  name: string;
  type: ExerciseType;
  muscle_group: MuscleGroup;
  description?: string;
  image_url?: string;
  video_url?: string;
  demonstration_gif?: string;
}

// Set types
export interface Set extends BaseEntity {
  workout_id: string;
  exercise_id: string;
  reps: number;
  weight: number; // in kg
  rest_time?: number; // in seconds
  set_order: number;
  completed?: boolean;
}

export interface SetWithExercise extends Set {
  exercise: Exercise;
}

// Routine types
export enum RoutineFrequency {
  CUSTOM = 'custom',
  WEEKLY_1 = 'weekly_1',
  WEEKLY_2 = 'weekly_2',
  WEEKLY_3 = 'weekly_3',
  WEEKLY_4 = 'weekly_4',
  WEEKLY_5 = 'weekly_5',
  WEEKLY_6 = 'weekly_6',
  DAILY = 'daily',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export interface Routine extends BaseEntity {
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  frequency?: RoutineFrequency;
  scheduled_days?: DayOfWeek[];
}

export interface RoutineExercise extends BaseEntity {
  routine_id: string;
  exercise_id: string;
  exercise: Exercise;
  target_sets: number;
  target_reps: number;
  target_weight?: number;
  order: number;
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExercise[];
}

// Statistics and analytics types
export interface WorkoutStats {
  total_workouts: number;
  total_duration: number;
  total_sets: number;
  average_duration: number;
  most_trained_muscle: MuscleGroup | null;
}

export interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  dates: string[];
  weights: number[];
  reps: number[];
  volume: number[]; // weight * reps
}

// Form types (for React Hook Form)
export interface WorkoutFormData {
  date: string;
  duration: number;
  notes?: string;
  routine_id?: string;
}

export interface WorkoutEditFormData extends WorkoutFormData {
  id: string;
}

export interface SetFormData {
  exercise_id: string;
  reps: number;
  weight: number;
  rest_time?: number;
}

export interface ExerciseFormData {
  name: string;
  type: ExerciseType;
  muscle_group: MuscleGroup;
  description?: string;
}

export interface RoutineFormData {
  name: string;
  description?: string;
  frequency?: RoutineFrequency;
  scheduled_days?: DayOfWeek[];
  exercises: {
    exercise_id: string;
    target_sets: number;
    target_reps: number;
    target_weight?: number;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
}

// Push Notification types
export interface PushSubscription extends BaseEntity {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  updated_at?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

