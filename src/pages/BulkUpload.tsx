import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { bulkSchedulePosts } from "@/lib/demoStore";
import { notifyPostsUpdated } from "@/lib/postEvents";

const previewData = [
  { content: "Exciting product launch!", platform: "Instagram", date: "2026-02-25", status: "valid" },
  { content: "Join our webinar on growth", platform: "LinkedIn", date: "2026-02-26", status: "valid" },
  { content: "Flash sale this weekend!", platform: "Facebook", date: "2026-02-27", status: "valid" },
  { content: "", platform: "Twitter", date: "2026-02-28", status: "error" },
];

export default function BulkUpload() {
  const handleTemplateDownload = () => {
    toast.success("CSV template download started");
  };

  const handleBulkSchedule = async () => {
    const validRows = previewData.filter((row) => row.status === "valid");
    try {
      await bulkSchedulePosts(
        validRows.map((row) => ({
          content: row.content,
          platform: row.platform.toLowerCase(),
          date: row.date,
          time: "10:00",
        })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk scheduling failed");
      return;
    }
    toast.success("Posted Successfully", {
      description: `${validRows.length} post(s) scheduled from CSV`,
    });
    notifyPostsUpdated();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Upload</h1>
        <p className="text-sm text-muted-foreground">Upload multiple posts at once via CSV</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="border-2 border-dashed rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Drop your CSV file here</h3>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <Button variant="outline" className="gap-2" onClick={handleTemplateDownload}><FileSpreadsheet className="h-4 w-4" /> Download Template</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Preview (Sample Data)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-muted-foreground">Content</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Platform</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-2">{row.content || <span className="text-destructive italic">Missing content</span>}</td>
                    <td className="p-2">{row.platform}</td>
                    <td className="p-2 text-muted-foreground">{row.date}</td>
                    <td className="p-2">
                      {row.status === "valid" ? (
                        <Badge variant="secondary" className="bg-success/10 text-success gap-1"><CheckCircle2 className="h-3 w-3" />Valid</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive gap-1"><AlertCircle className="h-3 w-3" />Error</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="gradient" className="gap-2" onClick={handleBulkSchedule}><Send className="h-4 w-4" /> Schedule All Valid</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
