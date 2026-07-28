import { useRef, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import axiosInstance from '../../../../config/axios';
import { uploadMedia } from '../../../../api/uploads';
import { withNewManagedImage } from '../../../../utils/managedMediaPayload';
import { FiUpload } from "react-icons/fi";

export default function AddWorkoutPlan({ isOpen, onClose, workoutPlan = null,onDone }) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    name: workoutPlan?.title || '',
    description: workoutPlan?.description || '',
    goal: workoutPlan?.goal || '',
    duration: workoutPlan?.durationWeeks || '',
    level: workoutPlan?.level || 'beginner',
    image: workoutPlan?.image || '',
    hashtags: workoutPlan?.hashtags?.join(', ') || '',
    isPublic: true,
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

  const goals = [
    { value: 'weight_loss', label: 'Weight Loss', icon: 'trending-down' },
    { value: 'muscle_gain', label: 'Muscle Gain', icon: 'fitness' },
    { value: 'strength', label: 'Build Strength', icon: 'barbell' },
    { value: 'endurance', label: 'Improve Endurance', icon: 'heart' },
    { value: 'flexibility', label: 'Increase Flexibility', icon: 'leaf' },
    { value: 'general_fitness', label: 'General Fitness', icon: 'medal' }
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workout plan name is required';
    }

    if (!formData.goal.trim()) {
      newErrors.goal = 'Goal is required';
    }

    if (!formData.level) {
      newErrors.level = 'Level is required';
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
        hashtags: formData.hashtags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      };

      const uploadedImage = file ? await uploadMedia(file) : undefined;
      submitData = withNewManagedImage(submitData, uploadedImage);

      const endpoint = workoutPlan ? `/workouts/update-plan/${workoutPlan._id}` : '/workouts/create-plan';
      await axiosInstance.request({
        method: workoutPlan ? 'put' : 'post',
        url: endpoint,
        data: submitData,
      });

      onDone();
      
      // Reset form if creating new workout plan
      if (!workoutPlan) {
        setFormData({
          name: '',
          description: '',
          goal: '',
          duration: '',
          level: 'beginner',
          image: '',
          hashtags: '',
          isPublic: true,
          isPremade: true
        });
        setFile(null);
      }
    } catch (error) {
      setSubmitError(error?.response?.data?.message || error?.message || 'Could not save the workout plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-plan-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="workout-plan-dialog-title" className="text-xl font-semibold text-gray-900">
            {workoutPlan ? 'Edit Workout Plan' : 'Add New Workout Plan'}
          </h2>
          <button
            type="button"
            aria-label="Close workout plan editor"
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
          {/* Name */}
          <div>
            <label htmlFor="workout-plan-name" className="block text-sm font-medium text-gray-700 mb-2">
              Workout Plan Name *
            </label>
            <input
              id="workout-plan-name"
              type="text"
              value={formData.name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'workout-plan-name-error' : undefined}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter workout plan name"
            />
            {errors.name && (
              <p id="workout-plan-name-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="workout-plan-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="workout-plan-description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Describe your workout plan..."
            />
          </div>

          {/* Goal */}
          <div>
            <label htmlFor="workout-plan-goal" className="block text-sm font-medium text-gray-700 mb-2">
              Goal *
            </label>
            <select
              id="workout-plan-goal"
              value={formData.goal}
              aria-invalid={Boolean(errors.goal)}
              aria-describedby={errors.goal ? 'workout-plan-goal-error' : undefined}
              onChange={(e) => handleChange('goal', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.goal ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a goal</option>
              {goals.map((goal) => (
                <option key={goal.value} value={goal.value}>
                  {goal.label}
                </option>
              ))}
            </select>
            {errors.goal && (
              <p id="workout-plan-goal-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.goal}
              </p>
            )}
          </div>

          {/* Duration and Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="workout-plan-duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (weeks)
              </label>
              <input
                id="workout-plan-duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8"
                min="1"
              />
            </div>

            <div>
              <label htmlFor="workout-plan-level" className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <select
                id="workout-plan-level"
                value={formData.level}
                aria-invalid={Boolean(errors.level)}
                aria-describedby={errors.level ? 'workout-plan-level-error' : undefined}
                onChange={(e) => handleChange('level', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {levels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              {errors.level && (
                <p id="workout-plan-level-error" role="alert" className="text-red-500 text-sm mt-1">
                  {errors.level}
                </p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </p>
            <button
              type="button"
              onClick={handleClick}
              className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-400 transition hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <FiUpload className="text-4xl text-gray-500 mb-2" />
              <p className="text-gray-600">
                {file ? file.name : 'Click to upload'}
              </p>
            </button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose workout plan image"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          {/* Hashtags */}
          <div>
            <label htmlFor="workout-plan-hashtags" className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags
            </label>
            <input
              id="workout-plan-hashtags"
              type="text"
              value={formData.hashtags}
              onChange={(e) => handleChange('hashtags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="fitness, strength, beginner, separated by commas"
            />
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
              {isLoading ? 'Saving...' : (workoutPlan ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
