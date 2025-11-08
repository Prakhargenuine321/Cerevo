import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';

// Inspiring YouTube videos for GATE aspirants
const videos = [
  "https://www.youtube.com/embed/Z6XH7E1h8iA", // "Your Time Is Limited" - Steve Jobs
  "https://www.youtube.com/embed/wnHW6o8WMas", // "Dream" - Motivational
  "https://www.youtube.com/embed/ZXsQAXx_ao0", // "Just Do It" - Shia LaBeouf
  "https://www.youtube.com/embed/26U_seo0a1g", // "The Mind" - Motivational
  "https://www.youtube.com/embed/zwa1Z59cM54", // "Everything Is Possible"
  "https://www.youtube.com/embed/_KPUWCdt3Ic", // "Rise Up" - Inspirational
  "https://www.youtube.com/embed/KuHg825kLHE", // "One More Step"
  "https://www.youtube.com/embed/DSZzbXw0DC8", // "The Mind" - Motivational
];


// Motivational quotes for engineers
const quotes = [
  "Every expert was once a beginner 🌱",
  "Success is built one page at a time 📚",
  "The best way to predict the future is to create it 🚀",
  "Your determination today leads to your success tomorrow ⭐",
  "Small progress is still progress 🎯",
  "Focus on the process, not the outcome 💫",
  "The only bad question is the one unasked 💭",
  "Your potential is unlimited 🌟",
  "Consistency over intensity 📈",
  "Today's preparation determines tomorrow's achievement 🎓"
];

export default function MotivationCard() {
  const [currentVideo, setCurrentVideo] = useState('');
  const [currentQuote, setCurrentQuote] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

  const refreshContent = () => {
    setIsChanging(true);
    setTimeout(() => {
      setCurrentVideo(getRandomItem(videos));
      setCurrentQuote(getRandomItem(quotes));
      setIsChanging(false);
    }, 300);
  };

  useEffect(() => {
    // Initial load
    refreshContent();

    // Refresh every 30 minutes
    const interval = setInterval(refreshContent, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-sm bg-card text-card-foreground dark:border-slate-800 overflow-hidden col-span-12 md:col-span-3 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary transition-colors duration-300 group-hover:text-primary/90" />
          </div>
          <span className="transition-colors duration-300 group-hover:text-primary">
            Motivation Boost
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Need a quick boost? Watch this — changes every 30m 🔄
          </p>
          <div className={`aspect-video rounded-lg overflow-hidden border border-slate-800/50 bg-black/20 transition-opacity duration-300 ${isChanging ? 'opacity-0' : 'opacity-100'}`}>
            {currentVideo && (
              <iframe
                src={currentVideo}
                title="Motivation Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center italic">
            {currentQuote}
          </p>
          <Button
            onClick={refreshContent}
            className="w-full mt-1 bg-linear-to-r from-cyan-500 to-violet-500 text-white hover:from-cyan-600 hover:to-violet-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            variant="secondary"
          >
            🔄 Next Video
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}