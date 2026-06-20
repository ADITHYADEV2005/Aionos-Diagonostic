import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolumeRenderer from '../components/VolumeRenderer'; // Assume we place the component here
import { Button } from "@/components/ui/button"; // Placeholder component

// Mock Component for UI elements
const Card: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-indigo-700">{title}</h3>
        {children}
    </div>
);
const AionosLogo: React.FC<{ size: string }> = ({ size }) => (
  <h1 className={`font-extrabold text-indigo-700 ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>
    AIONOS
  </h1>
);


const ProcessingResults: React.FC = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<'2D' | '3D' | '4D'>('2D');
  
  // Placeholder images for the three inputs and the 2D mask
  const images = [
    { name: "B-mode", src: 'bmode.png-b814dd5a-5344-4165-b8c2-8c754cd6b8fa' },
    { name: "Doppler", src: 'doppler.png-686420e5-241b-48ce-bc7f-c9d043fad14e' },
    { name: "Elastography", src: 'elastography.png-1d8f9d8d-a2e0-40a5-96cf-bf1221682456' },
    { name: "Segmentation Mask", src: 'segmented.png-100e07e1-10bf-49b1-8d08-13cd1e42ae91' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <AionosLogo size="lg" />
          <h1 className="text-3xl font-bold text-gray-800">AI Processing Results</h1>
          <Button onClick={() => navigate('/final-report')}>Generate Report →</Button>
        </div>

        {/* --- Visualization Mode Selector --- */}
        <div className="flex justify-center space-x-4 mb-8">
          <button 
            className={`px-6 py-2 rounded-full font-medium transition-all ${activeMode === '2D' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveMode('2D')}
          >
            2D Slices
          </button>
          <button 
            className={`px-6 py-2 rounded-full font-medium transition-all ${activeMode === '3D' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveMode('3D')}
          >
            3D Reconstruction
          </button>
          <button 
            className={`px-6 py-2 rounded-full font-medium transition-all ${activeMode === '4D' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveMode('4D')}
          >
            4D Dynamics
          </button>
        </div>

        {/* --- Display Area --- */}
        {activeMode === '2D' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {images.map(img => (
              <Card key={img.name} title={img.name}>
                <div className="h-48 flex items-center justify-center bg-gray-100 rounded-md">
                   {/* In a real app, you would use file_content_fetcher to display the images here */}
                   <p className="text-xs text-gray-500">Displaying: {img.name}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {(activeMode === '3D' || activeMode === '4D') && (
          <div className="flex justify-center items-center">
            <Card title={`${activeMode} Visualization`}>
              <VolumeRenderer mode={activeMode} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingResults;