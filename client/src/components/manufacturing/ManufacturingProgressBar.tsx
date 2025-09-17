import { cn } from "@/lib/utils";
import { 
  Hammer, 
  Package2, 
  Bed, 
  Scissors, 
  CheckCircle,
  Circle
} from "lucide-react";

interface ManufacturingStage {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  position: number;
}

interface ManufacturingProgressBarProps {
  stages: ManufacturingStage[];
  className?: string;
}

const getStageIcon = (stageName: string, status: string) => {
  const iconProps = {
    className: cn(
      "h-6 w-6 transition-colors",
      status === 'completed' ? "text-green-600" :
      status === 'in_progress' ? "text-blue-600" :
      "text-gray-400"
    )
  };

  if (stageName.includes('Frame') || stageName.includes('Construction')) {
    return <Hammer {...iconProps} />;
  } else if (stageName.includes('Padding')) {
    return <Package2 {...iconProps} />;
  } else if (stageName.includes('Cushioning')) {
    return <Bed {...iconProps} />;
  } else if (stageName.includes('Upholstery') || stageName.includes('Covering')) {
    return <Scissors {...iconProps} />;
  } else if (stageName.includes('Finishing')) {
    return <CheckCircle {...iconProps} />;
  }
  return <Circle {...iconProps} />;
};

const getStageColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-blue-500';
    default:
      return 'bg-gray-300';
  }
};

const getStageTextColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-700';
    case 'in_progress':
      return 'text-blue-700';
    default:
      return 'text-gray-500';
  }
};

export function ManufacturingProgressBar({ stages, className }: ManufacturingProgressBarProps) {
  const sortedStages = stages.sort((a, b) => a.position - b.position);
  
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Manufacturing Progress</h3>
        <p className="text-sm text-gray-600">Track the completion status of each manufacturing stage</p>
      </div>

      {/* Progress Bar Container */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200 z-0"></div>
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-8 left-8 h-0.5 bg-gradient-to-r from-green-500 via-blue-500 to-gray-200 z-10 transition-all duration-500"
          style={{ 
            width: `${Math.max(0, (sortedStages.filter(s => s.status === 'completed').length / sortedStages.length) * 100)}%` 
          }}
        ></div>

        {/* Stages */}
        <div className="flex justify-between items-start relative z-20">
          {sortedStages.map((stage, index) => (
            <div 
              key={stage.id} 
              className="flex flex-col items-center max-w-32"
              data-testid={`progress-stage-${stage.position}`}
            >
              {/* Stage Circle with Icon */}
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-lg",
                stage.status === 'completed' ? "bg-green-100 border-green-500 shadow-green-200" :
                stage.status === 'in_progress' ? "bg-blue-100 border-blue-500 shadow-blue-200 animate-pulse" :
                "bg-gray-50 border-gray-300 shadow-gray-100"
              )}>
                {getStageIcon(stage.name, stage.status)}
              </div>

              {/* Stage Number */}
              <div className={cn(
                "mt-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                stage.status === 'completed' ? "bg-green-500 text-white" :
                stage.status === 'in_progress' ? "bg-blue-500 text-white" :
                "bg-gray-300 text-gray-600"
              )}>
                {stage.position}
              </div>

              {/* Stage Name */}
              <div className="mt-3 text-center">
                <h4 className={cn(
                  "text-sm font-semibold transition-colors leading-tight",
                  getStageTextColor(stage.status)
                )}>
                  {stage.name}
                </h4>
                
                {/* Status Badge */}
                <div className={cn(
                  "mt-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                  stage.status === 'completed' ? "bg-green-100 text-green-800" :
                  stage.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {stage.status === 'not_started' ? 'Not Started' :
                   stage.status === 'in_progress' ? 'In Progress' :
                   'Completed'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Overall Progress:</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-bold text-green-600">
                {sortedStages.filter(s => s.status === 'completed').length}
              </span>
              <span className="text-gray-500"> / {sortedStages.length} completed</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {Math.round((sortedStages.filter(s => s.status === 'completed').length / sortedStages.length) * 100)}%
            </div>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${(sortedStages.filter(s => s.status === 'completed').length / sortedStages.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}