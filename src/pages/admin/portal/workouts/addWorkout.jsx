import { useRef, useState } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import axiosInstance from '../../../../config/axios';
import { uploadMedia } from '../../../../api/uploads';
import { withNewManagedImage } from '../../../../utils/managedMediaPayload';
import { FiUpload } from "react-icons/fi";

const ExerciseModal = ({ isOpen, onClose, onAddExercise }) => {
  const [exercise, setExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    duration: '',
    rest: '',
    notes: '',
    caloriesBurned: ''
  });

  const handleSubmit = () => {
    if (!exercise.name.trim()) return;
    
    onAddExercise({
      ...exercise,
      sets: exercise.sets ? Number(exercise.sets) : undefined,
      reps: exercise.reps ? Number(exercise.reps) : undefined,
      duration: exercise.duration ? Number(exercise.duration) : undefined,
      rest: exercise.rest ? Number(exercise.rest) : undefined,
      caloriesBurned: exercise.caloriesBurned ? Number(exercise.caloriesBurned) : undefined,
    });
    
    setExercise({
      name: '',
      sets: '',
      reps: '',
      duration: '',
      rest: '',
      notes: '',
      caloriesBurned: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 id="exercise-dialog-title" className="text-lg font-semibold text-gray-900">Add Exercise</h3>
          <button
            type="button"
            aria-label="Close exercise editor"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="exercise-name" className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Name *
            </label>
            <input
              id="exercise-name"
              type="text"
              value={exercise.name}
              onChange={(e) => setExercise({ ...exercise, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Push-ups, Squats"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exercise-sets" className="block text-sm font-medium text-gray-700 mb-2">Sets</label>
              <input
                id="exercise-sets"
                type="number"
                value={exercise.sets}
                onChange={(e) => setExercise({ ...exercise, sets: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3"
                min="1"
              />
            </div>
            <div>
              <label htmlFor="exercise-reps" className="block text-sm font-medium text-gray-700 mb-2">Reps</label>
              <input
                id="exercise-reps"
                type="number"
                value={exercise.reps}
                onChange={(e) => setExercise({ ...exercise, reps: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exercise-duration" className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
              <input
                id="exercise-duration"
                type="number"
                value={exercise.duration}
                onChange={(e) => setExercise({ ...exercise, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
                min="1"
              />
            </div>
            <div>
              <label htmlFor="exercise-rest" className="block text-sm font-medium text-gray-700 mb-2">Rest (sec)</label>
              <input
                id="exercise-rest"
                type="number"
                value={exercise.rest}
                onChange={(e) => setExercise({ ...exercise, rest: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="60"
                min="1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="exercise-calories" className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
            <input
              id="exercise-calories"
              type="number"
              value={exercise.caloriesBurned}
              onChange={(e) => setExercise({ ...exercise, caloriesBurned: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50"
              min="1"
            />
          </div>

          <div>
            <label htmlFor="exercise-notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              id="exercise-notes"
              value={exercise.notes}
              onChange={(e) => setExercise({ ...exercise, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Additional notes or instructions..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!exercise.name.trim()}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:bg-teal-200 transition-colors flex items-center justify-center"
            >
              <Plus size={16} className="mr-2" />
              Add Exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AddWorkout({ isOpen, onClose, workout = null,onDone }) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: workout?.title || '',
    description: workout?.description || '',
    category: workout?.category || 'strength',
    exercises: workout?.exercises || [],
    image: workout?.image || '',
    duration: workout?.duration || '',
    level: workout?.level || 'beginner',
    caloriesBurned: workout?.caloriesBurned || '',
    isPublic: true,
    hashtags: workout?.hashtags?.join(', ') || '',
    isPremade: true
  });

  const [errors, setErrors] = useState({});

    const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

   const fileInputRef = useRef(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const categories = [
    { value: 'strength', label: 'Strength Training' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'running', label: 'Running' },
    { value: 'hiit', label: 'HIIT' }
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Workout title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.exercises.length) {
      newErrors.exercises = 'Add at least one exercise before saving the workout';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError('');

    try {
      let submitData = {
        ...formData,
        duration: formData.duration ? Number(formData.duration) : undefined,
        caloriesBurned: formData.caloriesBurned ? Number(formData.caloriesBurned) : undefined,
        hashtags: formData.hashtags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      };

      const uploadedImage = file ? await uploadMedia(file) : undefined;
      submitData = withNewManagedImage(submitData, uploadedImage);

      const endpoint = workout ? `/workouts/update/${workout._id}` : '/workouts/create';
      await axiosInstance.request({
        method: workout ? 'put' : 'post',
        url: endpoint,
        data: submitData,
      });

      onDone();
      
      // Reset form if creating new workout
      if (!workout) {
        setFormData({
          title: '',
          description: '',
          category: 'strength',
          exercises: [],
          image: '',
          duration: '',
          level: 'beginner',
          caloriesBurned: '',
          isPublic: true,
          hashtags: '',
          isPremade: true
        });
      }
    } catch (error) {
      setSubmitError(error?.response?.data?.message || error?.message || 'Could not save the workout.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExercise = (exercise) => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { ...exercise, status: 'pending' }]
    });
    if (errors.exercises) {
      setErrors(current => ({ ...current, exercises: '' }));
    }
  };

  const handleRemoveExercise = (index) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-dialog-title"
        aria-hidden={exerciseModalOpen || undefined}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between p-6 border-b">
            <h2 id="workout-dialog-title" className="text-xl font-semibold text-gray-900">
              {workout ? 'Edit Workout' : 'Add New Workout'}
            </h2>
            <button
              type="button"
              aria-label="Close workout editor"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {submitError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            {/* Title */}
            <div>
              <label htmlFor="workout-title" className="block text-sm font-medium text-gray-700 mb-2">
                Workout Title *
              </label>
              <input
                id="workout-title"
                type="text"
                value={formData.title}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'workout-title-error' : undefined}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter workout title"
              />
              {errors.title && (
                <p id="workout-title-error" role="alert" className="text-red-500 text-sm mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="workout-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="workout-description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Describe your workout..."
              />
            </div>

            {/* Category and Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="workout-category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="workout-category"
                  value={formData.category}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? 'workout-category-error' : undefined}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p id="workout-category-error" role="alert" className="text-red-500 text-sm mt-1">
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="workout-level" className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  id="workout-level"
                  value={formData.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration and Calories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="workout-duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  id="workout-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                  min="1"
                />
              </div>

              <div>
                <label htmlFor="workout-calories" className="block text-sm font-medium text-gray-700 mb-2">
                  Calories Burned
                </label>
                <input
                  id="workout-calories"
                  type="number"
                  value={formData.caloriesBurned}
                  onChange={(e) => handleChange('caloriesBurned', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="300"
                  min="1"
                />
              </div>
            </div>

            {/* Managed workout image */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Workout image
              </p>
              <button
                type="button"
                onClick={handleClick}
                className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-400 transition hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <FiUpload className="mb-2 text-4xl text-gray-500" />
                <p className="text-gray-600">{file ? file.name : 'Click to upload'}</p>
              </button>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose workout image"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="sr-only"
                tabIndex={-1}
              />
            </div>

            {/* Hashtags */}
            <div>
              <label htmlFor="workout-hashtags" className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags
              </label>
              <input
                id="workout-hashtags"
                type="text"
                value={formData.hashtags}
                onChange={(e) => handleChange('hashtags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="strength, fitness, muscle, separated by commas"
              />
            </div>

            {/* Exercises Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="block text-sm font-medium text-gray-700">
                  Exercises ({formData.exercises.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setExerciseModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add Exercise
                </button>
              </div>
              {errors.exercises && (
                <p role="alert" className="mb-3 text-sm text-red-500">
                  {errors.exercises}
                </p>
              )}

              {formData.exercises.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {formData.exercises.map((exercise, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          {exercise.sets && `${exercise.sets} sets`}
                          {exercise.reps && ` × ${exercise.reps} reps`}
                          {exercise.duration && ` | ${exercise.duration}sec`}
                          {exercise.caloriesBurned && ` | ${exercise.caloriesBurned} cal`}
                        </div>
                        {exercise.notes && (
                          <p className="text-sm text-gray-500 mt-1">{exercise.notes}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${exercise.name || `exercise ${index + 1}`}`}
                        onClick={() => handleRemoveExercise(index)}
                        className="text-red-500 hover:text-red-700 transition-colors ml-3"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:bg-teal-200 transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {isLoading ? 'Saving...' : (workout ? 'Update Workout' : 'Create Workout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Modal */}
      <ExerciseModal
        isOpen={exerciseModalOpen}
        onClose={() => setExerciseModalOpen(false)}
        onAddExercise={handleAddExercise}
      />
    </>
  );
}
