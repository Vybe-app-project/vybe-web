import { useState } from "react";
import AdminLayout from "../../../../components/shared/adminLayout";
import { LuFolder, LuSquareCheck } from "react-icons/lu"
import WorkoutsTable from "./workouts-table";
import WorkoutPlansTable from "./workout-plans";

export default function Workouts(){
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        {
            id: 0,
            label: "Workouts",
            icon: LuSquareCheck,
        },
        {
            id: 1,
            label: "Workout Plans",
            icon: LuFolder,
        }
    ];

    return (
         <AdminLayout subTitle={activeTab==0? "Manage premade workouts": "Manage premade workout plans"} title={activeTab == 0? "Workouts": "Workout plans"}>
            <div>
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="w-5 h-5 mr-2" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 0 && (
                        <div>
                            <WorkoutsTable />
                        </div>
                    )}
                    {activeTab === 1 && (
                        <WorkoutPlansTable />
                    )}
                </div>
            </div>
         </AdminLayout>
    )
}