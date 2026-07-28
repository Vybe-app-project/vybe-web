import React, { useEffect, useState } from 'react';
import { Search, Plus, ChevronDown, Eye, Dumbbell, Clock, Flame, Users, MoreVertical, Edit, Trash2, Star } from 'lucide-react';
import { useDisclosure } from '@chakra-ui/react';
import AddWorkout from './addWorkout';
import axiosInstance from '../../../../config/axios';

// Skeleton Loader Component
const TableSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <th key={i} className="px-6 py-4 text-left">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-b border-gray-100">
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <td key={col} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Dropdown Menu Component
const DropdownMenu = ({ workoutId, onEdit, onDelete, onViewMore, onViewExercises }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical size={16} className="text-gray-500" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={() => { onViewMore(workoutId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye size={14} />
              View More
            </button>
            <button
              onClick={() => { onViewExercises(workoutId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Dumbbell size={14} />
              View Exercises
            </button>
            <button
              onClick={() => { onEdit(workoutId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit size={14} />
              Edit Workout
            </button>
            <button
              onClick={() => { onDelete(workoutId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete Workout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Category Badge Component
const CategoryBadge = ({ category }) => {
  const colors = {
    strength: 'bg-blue-100 text-blue-800',
    cardio: 'bg-red-100 text-red-800',
    yoga: 'bg-purple-100 text-purple-800',
    running: 'bg-green-100 text-green-800',
    hiit: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category] || 'bg-gray-100 text-gray-800'}`}>
      {category.toUpperCase()}
    </span>
  );
};

// Level Badge Component
const LevelBadge = ({ level }) => {
  const colors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level]}`}>
      {level}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
};

const WorkoutsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [detailWorkout, setDetailWorkout] = useState(null);
  const [actionError, setActionError] = useState('');

  // Dummy data based on your schema
  const [workouts, setWorkouts] = useState([]);

  const getWorkouts = async()=>{
    try{
        setIsLoading(true);
const res = await axiosInstance.get(`/workouts/commom/workouts/all/premade/fetch`);
        setIsLoading(false);
setWorkouts(res?.data?.workouts || [])
    }
    catch(error){
      setIsLoading(false);
      setActionError(error?.response?.data?.message || error?.message || 'Could not load workouts.');
    }
  }

  const filteredWorkouts = workouts.filter(workout =>
    workout.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.hashtags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddWorkout = () => {
    setSelectedWorkout(null);
    setIsOpen(true)
  };

  const handleEdit = (id) => {
    setSelectedWorkout(workouts.find(workout => workout._id === id) || null);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    const workout = workouts.find(item => item._id === id);
    if (!window.confirm(`Permanently delete ${workout?.title || 'this workout'}?`)) return;
    setActionError('');
    try {
      await axiosInstance.delete(`/workouts/${id}`);
      setWorkouts(current => current.filter(item => item._id !== id));
    } catch (error) {
      setActionError(error?.response?.data?.message || error?.message || 'Could not delete the workout.');
    }
  };

  const handleViewMore = (id) => {
    setDetailWorkout(workouts.find(workout => workout._id === id) || null);
  };

  const handleViewExercises = (id) => {
    setDetailWorkout(workouts.find(workout => workout._id === id) || null);
  };

  useEffect(()=>{
getWorkouts()
  },[])

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {actionError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Search and Add Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search workouts, categories, or hashtags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        <button
          onClick={handleAddWorkout}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-800 transition-colors"
        >
          <Plus size={20} />
          Add Workout
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workout
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calories
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exercises
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkouts.map((workout) => (
                <tr key={workout._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {workout.title}
                        </h3>
                        {/* <p className="text-sm text-gray-500 truncate max-w-xs">
                          {workout.description}
                        </p> */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex flex-wrap gap-1">
                            {workout.hashtags?.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs text-green-600 bg-blue-50 px-1 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <CategoryBadge category={workout.category} />
                  </td>
                  <td className="px-6 py-4">
                    <LevelBadge level={workout.level} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Clock size={14} className="text-gray-400" />
                      {workout.duration} min
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Flame size={14} className="text-red-500" />
                      {workout.caloriesBurned}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewExercises(workout._id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Dumbbell size={14} />
                      {workout.exercises?.length || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu
                      workoutId={workout._id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewMore={handleViewMore}
                      onViewExercises={handleViewExercises}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredWorkouts.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts found</h3>
            <p className="text-gray-500">Try adjusting your search terms or add a new workout.</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {/* {filteredWorkouts.length > 0 && (
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredWorkouts.length} of {workouts.length} workouts</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {workouts.filter(w => w.status === 'completed').length} Completed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                {workouts.filter(w => w.status === 'pending').length} Pending
              </span>
            </div>
          </div>
        </div>
      )} */}

      {
        isOpen && (
            <AddWorkout onDone={()=>{
getWorkouts();
                setIsOpen(false)
                setSelectedWorkout(null)
            }} isOpen={isOpen} onOpen={()=>{
                setIsOpen(true)
            }} onClose={()=>{
                setIsOpen(false)
                setSelectedWorkout(null)
            }} workout={selectedWorkout} />
        )
      }
      {detailWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{detailWorkout.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{detailWorkout.description || 'No description provided.'}</p>
              </div>
              <button type="button" onClick={() => setDetailWorkout(null)} className="rounded-lg px-3 py-1 text-slate-500">Close</button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Category</dt><dd className="font-semibold">{detailWorkout.category}</dd></div>
              <div><dt className="text-slate-500">Level</dt><dd className="font-semibold">{detailWorkout.level}</dd></div>
              <div><dt className="text-slate-500">Duration</dt><dd className="font-semibold">{detailWorkout.duration || 0} min</dd></div>
              <div><dt className="text-slate-500">Calories</dt><dd className="font-semibold">{detailWorkout.caloriesBurned || 0}</dd></div>
            </dl>
            <h3 className="mt-6 font-bold text-slate-900">Exercises</h3>
            <div className="mt-2 space-y-2">
              {detailWorkout.exercises?.length ? detailWorkout.exercises.map((exercise, index) => (
                <div key={`${exercise.name}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold">{exercise.name}</p>
                  <p className="text-slate-600">
                    {[exercise.sets && `${exercise.sets} sets`, exercise.reps && `${exercise.reps} reps`, exercise.duration && `${exercise.duration}s`].filter(Boolean).join(' · ') || 'No rep details'}
                  </p>
                </div>
              )) : <p className="text-sm text-slate-500">No exercises attached.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsTable;
