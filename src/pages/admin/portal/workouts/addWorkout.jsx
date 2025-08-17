import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import axiosInstance from '../../../../config/axios';
import s3 from '../../../../config/aws';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Exercise</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Name *
            </label>
            <input
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Sets</label>
              <input
                type="number"
                value={exercise.sets}
                onChange={(e) => setExercise({ ...exercise, sets: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reps</label>
              <input
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
              <input
                type="number"
                value={exercise.duration}
                onChange={(e) => setExercise({ ...exercise, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rest (sec)</label>
              <input
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
            <input
              type="number"
              value={exercise.caloriesBurned}
              onChange={(e) => setExercise({ ...exercise, caloriesBurned: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={exercise.notes}
              onChange={(e) => setExercise({ ...exercise, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Additional notes or instructions..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>

                        <button
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

const handleUpload = async () => {
  if (!file) return alert("Choose a file first!");

  const params = {
    Bucket: "vybe-direct-s3-upload",
    Key: `posts/${Date.now()}-${file.name}`,
    Body: file,
    ContentType: file.type,
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("File uploaded successfully:", data.Location);
    return data.Location;
  } catch (err) {
    console.error("Error uploading file:", err);
    alert("Upload failed!");
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        duration: formData.duration ? Number(formData.duration) : undefined,
        caloriesBurned: formData.caloriesBurned ? Number(formData.caloriesBurned) : undefined,
        hashtags: formData.hashtags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      };

      let image = file? await handleUpload(file): null
      submitData.image = image;

      const endpoint = workout ? `/workouts/update/${workout._id}` : '/workouts/create';
      const response = await axiosInstance.post(endpoint, submitData);

      console.log('Workout saved successfully:', response.data);
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
      console.error('Error saving workout:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExercise = (exercise) => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { ...exercise, status: 'pending' }]
    });
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {workout ? 'Edit Workout' : 'Add New Workout'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workout Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter workout title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
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
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories Burned
                </label>
                <input
                  type="number"
                  value={formData.caloriesBurned}
                  onChange={(e) => handleChange('caloriesBurned', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="300"
                  min="1"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              {/* <input
                type="url"
                value={formData.image}
                onChange={(e) => handleChange('image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/workout-image.jpg"
              /> */}
         <div
      onClick={handleClick}
      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-400 rounded-2xl cursor-pointer hover:border-blue-500 transition"
    >
      <FiUpload className="text-4xl text-gray-500 mb-2" />
      <p className="text-gray-600">Click to upload</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags
              </label>
              <input
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
                <label className="block text-sm font-medium text-gray-700">
                  Exercises ({formData.exercises.length})
                </label>
                <button
                  type="button"
                  onClick={() => setExerciseModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add Exercise
                </button>
              </div>

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
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              <button
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