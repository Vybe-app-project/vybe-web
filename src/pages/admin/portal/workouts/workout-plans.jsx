import React, { useEffect, useState } from 'react';
import { Search, Plus, ChevronDown, Eye, Calendar, Clock, Flame, Users, MoreVertical, Edit, Trash2, Star, Target } from 'lucide-react';
import { useDisclosure } from '@chakra-ui/react';
import axiosInstance from '../../../../config/axios';
import AddWorkoutPlan from './add-workout-plan';

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
const DropdownMenu = ({ planId, onEdit, onDelete, onViewMore, onViewWorkouts }) => {
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
              onClick={() => { onViewMore(planId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye size={14} />
              View More
            </button>
            <button
              onClick={() => { onViewWorkouts(planId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Calendar size={14} />
              View Workouts
            </button>
            <button
              onClick={() => { onEdit(planId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit size={14} />
              Edit Plan
            </button>
            <button
              onClick={() => { onDelete(planId); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete Plan
            </button>
          </div>
        </>
      )}
    </div>
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

const WorkoutPlansTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState([]);

  const getWorkoutPlans = async() => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/workouts/commom/workouts/plan/all/premade/fetch`);
      setIsLoading(false);
      console.log("workout plans:", res?.data);
      setWorkoutPlans(res?.data?.workouts || []);
    }
    catch(error) {
      setIsLoading(false);
      console.error("Error fetching workout plans:", error);
    }
  }

  const filteredPlans = workoutPlans.filter(plan =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.goal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.hashtags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddPlan = () => {
    setIsOpen(true);
  };

  const handleEdit = (id) => {
    console.log('Edit workout plan:', id);
  };

  const handleDelete = (id) => {
    console.log('Delete workout plan:', id);
  };

  const handleViewMore = (id) => {
    console.log('View more details:', id);
  };

  const handleViewWorkouts = (id) => {
    console.log('View workouts in plan:', id);
  };

  useEffect(() => {
    getWorkoutPlans();
  }, []);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Search and Add Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search workout plans, goals, or hashtags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        <button
          onClick={handleAddPlan}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-800 transition-colors"
        >
          <Plus size={20} />
          Add Workout Plan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goal
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
                  Workouts
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlans.map((plan) => (
                <tr key={plan._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {plan.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {plan.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex flex-wrap gap-1">
                            {plan.hashtags?.slice(0, 2).map((tag, index) => (
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
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Target size={14} className="text-blue-500" />
                      {plan.goal || 'General Fitness'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <LevelBadge level={plan.level} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Clock size={14} className="text-gray-400" />
                      {plan.durationWeeks} weeks
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Flame size={14} className="text-red-500" />
                      {plan.totalCaloriesBurned || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewWorkouts(plan._id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Calendar size={14} />
                      {plan.workouts?.length || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={plan.status} />
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu
                      planId={plan._id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewMore={handleViewMore}
                      onViewWorkouts={handleViewWorkouts}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workout plans found</h3>
            <p className="text-gray-500">Try adjusting your search terms or add a new workout plan.</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {/* {filteredPlans.length > 0 && (
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredPlans.length} of {workoutPlans.length} workout plans</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {workoutPlans.filter(p => p.status === 'completed').length} Completed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                {workoutPlans.filter(p => p.status === 'pending').length} Pending
              </span>
            </div>
          </div>
        </div>
      )} */}

      {
        isOpen && (
          <AddWorkoutPlan onDone={()=>{
            getWorkoutPlans();
            setIsOpen(false)
          }} isOpen={isOpen} onOpen={() => {
            setIsOpen(true)
          }} onClose={() => {
            setIsOpen(false)
          }} />
        )
      }
    </div>
  );
};

export default WorkoutPlansTable;