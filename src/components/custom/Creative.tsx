'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatedLock } from './AnimatedLock'

function useCharacterState(
  memberId: string | null,
  performanceGoals: {
    overall_performance_goal: number;
    number_of_calls_average: number;
  } | null
) {
  const [characterStates, setCharacterStates] = useState<{
    [key: string]: {
      isLocked: boolean;
      animationShown: boolean;
      metrics: any | null;
    };
  }>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initializationRef = useRef(false);

  useEffect(() => {
    if (!memberId || !performanceGoals || initializationRef.current) return;
    
    async function initializeCharacterStates() {
      try {
        // Fetch all character states in parallel
        const statePromises = characters.map(async (character) => {
          const [unlockRes, metricsRes] = await Promise.all([
            fetch(`/api/tbai-assistants/unlock-animations?memberId=${memberId}&characterName=${character.name}`),
            fetch(`/api/tbai-assistants/character-performance?memberId=${memberId}&characterName=${character.name}`)
          ]);

          const [unlockData, metricsData] = await Promise.all([
            unlockRes.json(),
            metricsRes.json()
          ]);

          return {
            name: character.name,
            isLocked: !unlockData.unlocked,
            animationShown: unlockData.shown,
            metrics: metricsData
          };
        });

        const results = await Promise.all(statePromises);
        
       const newStates = results.reduce<Record<string, CharacterState>>((acc, result: CharacterStateResult) => {
  acc[result.name] = {
    isLocked: result.isLocked,
    animationShown: result.animationShown,
    metrics: result.metrics
  };
  return acc;
}, {});

        setCharacterStates(newStates);
        setIsInitialLoad(false);
        initializationRef.current = true;
      } catch (error) {
        console.error('Error initializing character states:', error);
        setIsInitialLoad(false);
      }
    }

    initializeCharacterStates();
  }, [memberId, performanceGoals]);

  const unlockCharacter = useCallback(async (characterName: string) => {
    if (!memberId) return;

    try {
      await fetch('/api/tbai-assistants/unlock-animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, characterName })
      });

      setCharacterStates(prev => ({
        ...prev,
        [characterName]: {
          ...prev[characterName],
          isLocked: false,
          animationShown: true
        }
      }));
    } catch (error) {
      console.error('Error unlocking character:', error);
    }
  }, [memberId]);

  return {
    characterStates,
    isInitialLoad,
    unlockCharacter
  };
}

declare global {
  interface Window {
    $memberstackDom: {
      getCurrentMember: () => Promise<{
        data: {
          id: string;
        } | null;
      }>;
    };
  }
}

const scrollbarStyles = `
  .scrollbar-thin {
    /* Firefox */
    scrollbar-width: thin;
    scrollbar-color: #f2f3f8 transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 2px !important;
    display: block !important;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent !important;
    display: block !important;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #f2f3f8 !important;
    border-radius: 20px !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Explicitly remove both up and down buttons */
  .scrollbar-thin::-webkit-scrollbar-button:single-button {
    display: none !important;
    height: 0 !important;
    width: 0 !important;
    background: none !important;
  }
  
  .scrollbar-thin::-webkit-scrollbar-button:start {
    display: none !important;
  }
  
  .scrollbar-thin::-webkit-scrollbar-button:end {
    display: none !important;
  }
  
  /* Remove any potential button spaces */
  .scrollbar-thin::-webkit-scrollbar-button:vertical:start:decrement,
  .scrollbar-thin::-webkit-scrollbar-button:vertical:end:increment,
  .scrollbar-thin::-webkit-scrollbar-button:vertical:start:increment,
  .scrollbar-thin::-webkit-scrollbar-button:vertical:end:decrement {
    display: none !important;
  }
`

interface Character {
  name: string
  difficulty: "Easy" | "Intermediate" | "Expert"
  age: number
  description: string
  imageSrc: string
  color: string
  locked?: boolean
  scores?: {
    overallPerformance: number
    engagement: number
    objectionHandling: number
    informationGathering: number
    programExplanation: number
    closingSkills: number
    overallEffectiveness: number
  }
}
interface PerformanceMetrics {
  overall_performance: number;
  engagement: number;
  objection_handling: number;
  information_gathering: number;
  program_explanation: number;
  closing_skills: number;
  overall_effectiveness: number;
  total_calls: number;
}

interface AnimatedStartButtonProps {
  onStart: () => void;
  isLocked?: boolean;
  showLockedText?: boolean;
}

interface CharacterState {
  isLocked: boolean;
  animationShown: boolean;
  metrics: any;  // You can make this more specific based on your metrics type
}

// Then define interface for the result object
interface CharacterStateResult {
  name: string;
  isLocked: boolean;
  animationShown: boolean;
  metrics: any;
}

const AnimatedStartButton: React.FC<AnimatedStartButtonProps> = ({ onStart, isLocked, showLockedText }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'complete'>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (state === 'loading') {
      const startTime = Date.now();
      const duration = 3000; // 3 seconds

      const updateProgress = () => {
        const elapsedTime = Date.now() - startTime;
        const newProgress = Math.min((elapsedTime / duration) * 100, 100);
        setProgress(newProgress);

        if (newProgress < 100) {
          requestAnimationFrame(updateProgress);
        } else {
          setState('complete');
        }
      };

      requestAnimationFrame(updateProgress);
    }
  }, [state])

  const handleClick = () => {
    if (state === 'idle' && !isLocked) {
      onStart();
      setState('loading')
      setProgress(0)
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-[20px] bg-[#5f0bb9] text-white shadow-lg w-full h-[48px] ${isLocked ? 'opacity-50' : ''}`}
         style={{
           boxShadow: "0 4px 14px 0 rgba(95, 11, 185, 0.39)"
         }}>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' && (
          <motion.button
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            onClick={handleClick}
            whileHover={!isLocked ? { scale: 1.05 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              scale: { type: "spring", stiffness: 300, damping: 25 },
              opacity: { duration: 0.2 }
            }}
            disabled={isLocked}
          >
            START {showLockedText ? '(LOCKED)' : ''}
          </motion.button>
        )}

        {state === 'loading' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div 
              className="mb-2 text-sm"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              Preparing call...
            </motion.div>
            <div className="h-2 w-4/5 overflow-hidden rounded-full bg-[#4c098f]">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {state === 'complete' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div 
              className="text-lg font-bold"
              initial={{ y: 48 }}
              animate={{ y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                delay: 0.1
              }}
            >
              Call Starting
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const characters: Character[] = [
  {
    name: "Rachel",
    difficulty: "Easy",
    age: 25,
    description: "I'm Rachel, a 30-year-old teacher who's trying to understand this whole seller financing thing. When I'm teaching my kids, we break down complex topics into simple steps, and that's exactly what I need right now. I've heard it could be a good option for selling my home, but honestly, all these financial terms are a bit overwhelming. Can we start with the basics?",
    imageSrc: "https://res.cloudinary.com/dmbzcxhjn/image/upload/672b1e8d64a9a176ff36b867_image_2_-p-500_ej3zns.jpg",
    color: "#23c55f",
    locked: false, // Add this line
  },
  {
    name: "Mike",
    difficulty: "Intermediate",
    age: 40,
    description: "I'm Mike, 45, and I've got my hands dirty in enough real estate deals to know what works and what doesn't. As a contractor, I see properties for what they really are - no fancy talk needed. Looking into lease options for my property sale, but I need to make sure I'm not boxing myself into a corner. Let's talk real numbers and real scenarios.",
    imageSrc: "https://res.cloudinary.com/dmbzcxhjn/image/upload/67290d0fbf7ca486c43a332c_image_10_-p-500_ed6jna.jpg",
    color: "#FCA147",
    locked: true,
  },
  {
    name: "Tom",
    difficulty: "Expert",
    age: 55,
    description: "I'm Tom, 60, and after decades of practicing law and building my real estate portfolio, I've learned to spot potential pitfalls from a mile away. Subject-to deals intrigue me from an investment perspective, but the legal nuances keep me up at night. I need to understand every clause, contingency, and potential liability before moving forward.",
    imageSrc: "https://res.cloudinary.com/dmbzcxhjn/image/upload/672908567a2dbb4c39d1f8f3_image_9_-p-500_vo7noq.png",
    color: "#DC2626",
    locked: true,
  },
]

function ScorePanel({ 
  characterName, 
  memberId,
  performanceGoals,
  teamId 
}: { 
  characterName: string; 
  memberId: string;
  teamId: string | null;
  performanceGoals: {
    overall_performance_goal: number;
    number_of_calls_average: number;
  }; // Remove | null here since we're handling it with optional chaining
}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousMetrics = useRef<PerformanceMetrics | null>(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `/api/tbai-assistants/character-performance?memberId=${memberId}&characterName=${characterName}`
        );
        
        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        const data = await response.json();
        previousMetrics.current = metrics;  // Save current metrics before updating
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (memberId && characterName) {
      fetchMetrics();
    }
  }, [memberId, characterName, teamId]);

  const handleRecordsClick = (e: React.MouseEvent) => {
  e.preventDefault();
  window.top!.location.href = 'https://app.trainedbyai.com/call-records';
};

  // Use previous metrics while loading
  const displayMetrics = metrics || previousMetrics.current;

  if (!displayMetrics && isLoading) {
  return (
    <div className="w-full text-sm h-[320px] flex flex-col">
      <div className="flex-grow">
        {/* Skeleton loader matching final content structure */}
        <h3 className="text-sm font-semibold mb-2 bg-white py-2">
  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-56"></div>
</h3>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-[#f8fdf6] p-3 rounded-lg mb-3 mr-2">
              <div className="animate-pulse flex justify-between items-center mb-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            </div>
          ))}
        </div>
        <div className="h-12"></div> {/* Space for button */}
      </div>
    );
  }

  const categories = [
    { key: 'overall_performance', label: 'Overall Performance' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'objection_handling', label: 'Objection Handling' },
    { key: 'information_gathering', label: 'Information Gathering' },
    { key: 'program_explanation', label: 'Program Explanation' },
    { key: 'closing_skills', label: 'Closing Skills' },
    { key: 'overall_effectiveness', label: 'Overall Effectiveness' },
  ];

  return (
    <>
      <style jsx>{scrollbarStyles}</style>
      <div className="w-full text-sm h-[320px] flex flex-col">
        <div className="flex-grow overflow-y-auto scrollbar-thin">
          <h3 className="text-sm font-semibold mb-2 sticky top-0 bg-white py-2 z-10">
  <div className="mb-1">
    {Math.max(0, performanceGoals.number_of_calls_average - (displayMetrics?.total_calls || 0))} calls left to complete the challenge.
  </div>
  <div>
    Your score from last {displayMetrics?.total_calls || 0} calls:
  </div>
</h3>
          {categories.map(({ key, label }) => (
            <div key={key} className="bg-[#f8fdf6] p-3 rounded-lg mb-3 mr-2">
              <div className="flex justify-between items-center mb-1">
                <span className={`font-medium ${key === 'overall_performance' ? 'text-base' : 'text-xs'}`}>
                  {label}
                </span>
                <span className={`font-bold text-green-500 ${key === 'overall_performance' ? 'text-lg' : 'text-xs'}`}>
                  {(displayMetrics?.[key as keyof PerformanceMetrics] ?? 0)}/100
                </span>
              </div>
              <div className={`bg-gray-200 rounded-full overflow-hidden ${key === 'overall_performance' ? 'h-3' : 'h-2'}`}>
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${displayMetrics?.[key as keyof PerformanceMetrics] ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={handleRecordsClick}
          className="w-full py-3 rounded-[20px] text-black font-semibold text-lg transition-all hover:opacity-90 hover:shadow-lg bg-white shadow-md mb-6"
        >
          Go to Call Records
        </button>
      </div>
    </>
  );
}

function LockedOverlay({ 
  previousAssistant, 
  isLastLocked, 
  difficulty,
  performanceGoals,
  showUnlockAnimation,
  onAnimationComplete,
  characterName
}: { 
  previousAssistant: string; 
  isLastLocked: boolean; 
  difficulty: string;
  performanceGoals: {
    overall_performance_goal: number;
    number_of_calls_average: number;
  };
  showUnlockAnimation?: boolean;
  onAnimationComplete?: () => void;
  characterName: string;
}) {
  const glowColor = 
    difficulty === 'Easy' 
      ? 'rgba(72, 199, 174, 0.5)' 
      : difficulty === 'Intermediate'
        ? 'rgba(252, 161, 71, 0.5)'
        : 'rgba(220, 38, 38, 0.5)';

  useEffect(() => {
    if (showUnlockAnimation) {
      const timeout = setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 3000); // Match this with your animation duration

      return () => clearTimeout(timeout);
    }
  }, [showUnlockAnimation, onAnimationComplete]);

  return (
    <div 
      className="absolute inset-0 rounded-[15px] flex items-center justify-center bg-black/40 backdrop-blur-sm" 
      style={{ 
        boxShadow: `0 0 20px ${glowColor}`
      }}
    >
      <div className="w-[400px] h-[400px] p-6 pt-16 text-center flex flex-col items-center justify-start">
        <div>
          <div className="flex justify-center items-center gap-4 mb-8 w-full">
            <AnimatedLock 
              characterName={previousAssistant}
              isLocked={!showUnlockAnimation}
              onUnlockShown={onAnimationComplete}
            />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">Character Locked</h3>
          <p className="text-white text-xl mb-8">
            {`Achieve Overall Performance above ${performanceGoals.overall_performance_goal} from the past ${performanceGoals.number_of_calls_average} calls on ${previousAssistant} to Unlock.`}
          </p>
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">Overall Performance</span>
              <span className="text-sm font-bold text-white">{performanceGoals.overall_performance_goal}/100</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-white to-gray-200 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${performanceGoals.overall_performance_goal}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function CharacterSelection() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<{ [key: string]: 'description' | 'scores' }>({
    Rachel: 'description',
    Mike: 'description',
    Tom: 'description'
  });
  const [memberId, setMemberId] = useState<string | null>(null);
  const [performanceGoals, setPerformanceGoals] = useState<{
    overall_performance_goal: number;
    number_of_calls_average: number;
  } | null>(null);  // Start as null since we'll fetch it
  
  const { characterStates, isInitialLoad, unlockCharacter } = useCharacterState(memberId, performanceGoals);

useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tid = urlParams.get('teamId');
    setTeamId(tid);
  }, []);

  useEffect(() => {
  // Get memberId directly from URL
  const searchParams = new URLSearchParams(window.location.search);
  const mid = searchParams.get('memberId');
  console.log('Found memberId in URL:', mid);
  
  if (mid) {
    setMemberId(mid);
  } else {
    // Only try message approach if no URL parameter
    window.parent.postMessage({ type: 'GET_MEMBER_ID' }, '*');
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'SET_MEMBER_ID' && event.data.memberId) {
      console.log('Received member ID:', event.data.memberId);
      setMemberId(event.data.memberId);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

const handleStart = async (character: Character) => {
  console.log('Start button clicked for:', character.name);
  console.log('Current memberId:', memberId);
  console.log('Current teamId:', teamId);

  if (!memberId) {
    console.error('No member ID found');
    return;
  }

  const apiUrls: Record<string, string> = {
    Rachel: 'https://aiemployee.app.n8n.cloud/webhook/2b36f9f1-6dc9-4bf5-878d-f63dffb0141b',
    Mike: 'https://aiemployee.app.n8n.cloud/webhook/2b36f9f1-6dc9-4bf5-878d-f63dffb0141b',
    Tom: 'https://aiemployee.app.n8n.cloud/webhook/2b36f9f1-6dc9-4bf5-878d-f63dffb0141b'
  };

  const apiUrl = apiUrls[character.name];
  if (!apiUrl) {
    console.error('No API URL found for character:', character.name);
    return;
  }

  try {
    // Create the form directly with the data we need
    const form = document.createElement('form');
    form.method = 'POST';
    form.style.display = 'none';
    form.target = '_top'; // Force top-level navigation

    // Add member_ID input
    const memberInput = document.createElement('input');
    memberInput.type = 'hidden';
    memberInput.name = 'member_ID';
    memberInput.value = memberId;
    form.appendChild(memberInput);

    // Add teamId input if it exists
    if (teamId) {
      const teamInput = document.createElement('input');
      teamInput.type = 'hidden';
      teamInput.name = 'teamId';
      teamInput.value = teamId;
      form.appendChild(teamInput);
    }

    // Add character input
    const characterInput = document.createElement('input');
    characterInput.type = 'hidden';
    characterInput.name = 'character';
    characterInput.value = character.name;
    form.appendChild(characterInput);

    // Set the form action URL with query parameters
    const params = new URLSearchParams({
      member_ID: memberId,
      ...(teamId && { teamId }),
      character: character.name
    });
    form.action = `${apiUrl}?${params.toString()}`;

    // Add the form to the document and submit it
    document.body.appendChild(form);
    form.submit();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);

  } catch (error) {
    console.error('Error during redirect:', error);
    
    // Fallback: Try direct navigation if form submission fails
    if (window.top) {
      window.top.location.href = apiUrl + '?' + new URLSearchParams({
        member_ID: memberId,
        ...(teamId && { teamId }),
        character: character.name
      }).toString();
    }
  }
};

  const togglePanel = (name: string) => {
    setActivePanel(prev => ({
      ...prev,
      [name]: prev[name] === 'description' ? 'scores' : 'description'
    }));
  };

useEffect(() => {
  const fetchPerformanceGoals = async () => {
    try {
      // Get teamId from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const teamId = urlParams.get('teamId');

      console.log('Fetching performance goals for teamId:', teamId);
      const response = await fetch(`/api/tbai-assistants/performance-goals?teamId=${teamId}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched performance goals:', data);
        setPerformanceGoals(data);
      } else {
        console.error('Failed to fetch performance goals:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching performance goals:', error);
    }
  };

  fetchPerformanceGoals();
}, []);

useLayoutEffect(() => {
  const updateHeight = () => {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({
      type: 'RESIZE_IFRAME',
      height: height
    }, '*');
  };

  // Update height on initial render
  updateHeight();

  // Update height when panel state changes
  const observer = new ResizeObserver(updateHeight);
  observer.observe(document.body);

  // Update height when images load
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (img.complete) {
      updateHeight();
    } else {
      img.addEventListener('load', updateHeight);
    }
  });

  return () => {
    observer.disconnect();
    images.forEach(img => img.removeEventListener('load', updateHeight));
  };
}, [activePanel]);
  
return (
  <div className="w-full h-auto bg-white rounded-[20px]">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
      {characters.map((character, index) => {
        if (isInitialLoad) {
          return (
            <motion.div
              key={`${character.name}-skeleton`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.2,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="bg-white rounded-[20px] shadow-lg overflow-hidden"
            >
              <div className="p-4 flex flex-col items-center">
                {/* Profile Image Skeleton */}
                <div className="w-32 h-32 mb-4 rounded-[20px] bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
                
                {/* Name and Difficulty Skeleton */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full animate-pulse" />
                </div>

                {/* Start Button Skeleton */}
                <div className="w-full h-12 mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-[20px] animate-pulse" />

                {/* Toggle Button Skeleton */}
                <div className="w-full h-12 mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-[20px] animate-pulse" />

                {/* Description Skeleton */}
                <div className="space-y-2 w-full">
                  <div className="h-4 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4/6 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </motion.div>
          );
        }

        const characterState = characterStates[character.name];
        const prevCharacter = index > 0 ? characters[index - 1] : null;
        const prevCharacterState = prevCharacter ? characterStates[prevCharacter.name] : null;

        let shouldBeUnlocked = index === 0;
        if (index > 0 && prevCharacterState && prevCharacterState.metrics && performanceGoals) {
          const meetsPerformance = prevCharacterState.metrics.overall_performance >= performanceGoals.overall_performance_goal;
          const meetsCalls = prevCharacterState.metrics.total_calls >= performanceGoals.number_of_calls_average;
          shouldBeUnlocked = meetsPerformance && meetsCalls;
        }

        if (shouldBeUnlocked && characterState?.isLocked && !characterState.animationShown) {
          unlockCharacter(character.name);
        }

        const showUnlockAnimation = shouldBeUnlocked && characterState?.isLocked && !characterState.animationShown;

        return (
          <motion.div 
            key={character.name}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.2,
              ease: [0.23, 1, 0.32, 1]
            }}
            className="relative rounded-[20px] overflow-hidden"
            style={{ 
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
      <div className="p-4 flex flex-col items-center text-center">
        {/* Character card content remains the same */}
        <div className="w-full px-5 mb-2">
          <div 
            className="w-32 h-32 mx-auto relative overflow-hidden rounded-[20px] transition-all duration-300 ease-in-out" 
            style={{ 
              perspective: '1000px',
            }}
          >
            <div 
              className="w-full h-full absolute inset-0" 
              style={{ 
                border: `7px solid ${
                  character.name === 'Rachel'
                    ? 'rgba(35, 197, 95, 0.5)'
                    : character.name === 'Mike'
                      ? 'rgba(250, 162, 72, 0.5)'
                      : 'rgba(236, 27, 38, 0.5)'
                }`,
                borderRadius: '20px',
                zIndex: 2
              }}
            />
            <div className="w-full h-full relative">
              <Image
                src={character.imageSrc}
                alt={character.name}
                fill
                className="object-cover rounded-[14px]"
              />
            </div>
          </div>
        </div>

        <div className="w-full mb-2 flex flex-col items-center">
          <div className="flex items-center gap-2 py-1">
            <h2 className="text-2xl font-bold text-black">
              {character.name}
            </h2>
            <div
              className="px-3 py-1 rounded-full text-white font-semibold text-sm"
              style={{ backgroundColor: character.color }}
            >
              {character.difficulty.toUpperCase()}
            </div>
          </div>
          <AnimatedStartButton 
            onStart={() => handleStart(character)}
            isLocked={characterState?.isLocked}
            showLockedText={characterState?.isLocked}
          />
        </div>

<div className="relative w-full flex-grow">
  <button 
    onClick={() => togglePanel(character.name)}
    className="w-full py-3 rounded-[20px] text-black font-semibold text-lg transition-all hover:opacity-90 hover:shadow-lg bg-white shadow-md mb-2"
  >
    <span>
      {activePanel[character.name] === 'description' ? 'View Performance' : 'Back to Description'}
    </span>
    {activePanel[character.name] === 'description' ? (
      <ChevronDown size={20} className="inline-block ml-2" />
    ) : (
      <ChevronUp size={20} className="inline-block ml-2" />
    )}
  </button>

          <div className="min-h-[300px] overflow-hidden relative">
            <AnimatePresence initial={false}>
              {activePanel[character.name] === 'description' ? (
                <motion.div
                  key="description"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <p className="text-gray-600 text-base leading-relaxed text-center pt-2">
                    {character.description}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="scores"
                  initial={{ y: "-100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                  className="absolute inset-0 overflow-hidden"
                >
                  {!isInitialLoad && performanceGoals && (
  <ScorePanel 
    characterName={character.name}
    memberId={memberId || ''}
    teamId={teamId}
    performanceGoals={performanceGoals}
  />
)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Only show LockedOverlay if character is locked */}
     {characterState?.isLocked && performanceGoals && (
              <LockedOverlay 
                previousAssistant={prevCharacter?.name || ''}
                isLastLocked={index === characters.length - 1}
                difficulty={character.difficulty}
                performanceGoals={performanceGoals}
                showUnlockAnimation={showUnlockAnimation}
                onAnimationComplete={() => {
                  if (showUnlockAnimation) {
                    unlockCharacter(character.name);
                  }
                }}
                characterName={character.name}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  </div>
);
}
