import { useState } from "react";
import { Hash, Search, Copy, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const categories = ["Marketing", "Technology", "Fitness", "Food", "Travel", "Fashion"];
const trending = [
  { tag: "#AIMarketing", posts: "245K", growth: "+34%" },
  { tag: "#ContentCreator", posts: "1.2M", growth: "+18%" },
  { tag: "#SocialMediaTips", posts: "890K", growth: "+22%" },
  { tag: "#DigitalStrategy", posts: "156K", growth: "+41%" },
  { tag: "#BrandBuilding", posts: "320K", growth: "+15%" },
  { tag: "#GrowthHacking", posts: "445K", growth: "+28%" },
  { tag: "#StartupLife", posts: "670K", growth: "+12%" },
  { tag: "#MarketingTips", posts: "980K", growth: "+19%" },
  { tag: "#Entrepreneurship", posts: "1.5M", growth: "+9%" },
  { tag: "#ContentStrategy", posts: "210K", growth: "+37%" },
  { tag: "#VideoMarketing", posts: "380K", growth: "+45%" },
  { tag: "#InfluencerMarketing", posts: "520K", growth: "+26%" },
];

export default function HashtagSuggestions() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [pool, setPool] = useState(trending);
  const filtered = pool.filter((t) => t.tag.toLowerCase().includes(search.toLowerCase()) && (activeCategory === "all" || t.tag.toLowerCase().includes(activeCategory.toLowerCase())));

  const copy = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Copied ${tag}`);
  };

  const runAiSuggest = () => {
    const tag = `#${(search || "social").replace(/[^a-z0-9]/gi, "").slice(0, 12)}Growth`;
    if (!tag || tag === "#Growth") {
      toast.info("Type a niche to generate targeted hashtags");
      return;
    }
    const next = { tag, posts: `${120 + Math.floor(Math.random() * 900)}K`, growth: `+${10 + Math.floor(Math.random() * 40)}%` };
    setPool((prev) => [next, ...prev.filter((p) => p.tag !== next.tag)]);
    toast.success("AI suggestions updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hashtag Suggestions</h1>
        <p className="text-sm text-muted-foreground">Discover trending hashtags to boost your reach</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search hashtags by niche..." className="pl-10 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="gradient" className="gap-1.5" onClick={runAiSuggest}><Sparkles className="h-4 w-4" /> AI Suggest</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={activeCategory === "all" ? "default" : "secondary"}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setActiveCategory("all")}
        >
          All
        </Badge>
        {categories.map((c) => (
          <Badge
            key={c}
            variant={activeCategory === c.toLowerCase() ? "default" : "secondary"}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setActiveCategory(c.toLowerCase())}
          >
            {c}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => (
          <Card key={t.tag} className="card-hover cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.tag}</p>
                  <p className="text-xs text-muted-foreground">{t.posts} posts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-success flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />{t.growth}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(t.tag)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
