import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getRestaurant, getTables } from "@/services/firebaseService";
import { QRDesignState, DEFAULT_DESIGN, BackgroundOption } from "./types";
import { BACKGROUNDS } from "./constants";
import { QRPreview } from "./components/QRPreview";
import { QRControls } from "./components/QRControls";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Save, Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";

export const QRDesignerPage = () => {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [tables, setTables] = useState<any[]>([]);

    const [design, setDesign] = useState<QRDesignState>(DEFAULT_DESIGN);
    const previewRef = useRef<HTMLDivElement>(null);
    const bulkContainerRef = useRef<HTMLDivElement>(null);

    // Load initial data
    useEffect(() => {
        const fetchData = async () => {
            if (!userProfile?.restaurantId) return;

            try {
                // Get restaurant
                const rest = await getRestaurant(userProfile.restaurantId);
                setRestaurant(rest);

                // Initialize design with restaurant name
                setDesign(prev => ({
                    ...prev,
                    restaurantName: rest.name,
                    // Try to load saved template from localStorage if exists
                    ...(localStorage.getItem(`qr_template_${rest.id}`)
                        ? JSON.parse(localStorage.getItem(`qr_template_${rest.id}`)!)
                        : {})
                }));

                // Get tables for bulk export
                const tbls = await getTables(rest.id!);
                setTables(tbls || []);

                // Pre-fill table number if URL param exists
                const tableParam = searchParams.get('table');
                if (tableParam) {
                    setDesign(prev => ({ ...prev, tableNumber: tableParam }));
                }

            } catch (error: any) {
                console.error("Error loading QR data:", error);
                toast({ title: "Error loading data", variant: "destructive", description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userProfile, searchParams]);

    // Design helpers
    const currentBackground = BACKGROUNDS.find(b => b.id === design.backgroundId) || BACKGROUNDS[0];

    const handleUpdateDesign = (updates: Partial<QRDesignState>) => {
        setDesign(prev => ({ ...prev, ...updates }));
    };

    const handleSaveTemplate = () => {
        if (!restaurant?.id) return;
        localStorage.setItem(`qr_template_${restaurant.id}`, JSON.stringify(design));
        toast({ title: "Template Saved", description: "Your design has been saved for future use." });
    };

    // Download Handlers
    const handleDownloadSingle = async (format: 'png' | 'pdf') => {
        if (!previewRef.current) return;

        const canvas = await html2canvas(previewRef.current, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: null
        });

        const filename = `${restaurant?.name || 'Restaurant'}_Table_${design.tableNumber}_QR`;

        if (format === 'png') {
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
            const pdf = new jsPDF({
                orientation: design.layout === 'landscape' ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width, canvas.height] // Match canvas exactly or use A4 logic
            });
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${filename}.pdf`);
        }
    };

    const handleDownloadBulk = async () => {
        if (!bulkContainerRef.current || tables.length === 0) {
            toast({ title: "No tables found to generate." });
            return;
        }

        toast({ title: "Starting Bulk Generation", description: `Generating QR codes for ${tables.length} tables... This may take a moment.` });

        // Using a simple timeout to ensure React renders the hidden container fully
        await new Promise(r => setTimeout(r, 1000));

        const zip = new JSZip();
        const folder = zip.folder("qr_codes");

        // The children of the container. 
        // NOTE: Since these are rendered as React components, we need access to the DOM nodes.
        // We can't access them directly by index if they are not mounted or virtual.
        // But the hidden container should have them.

        const tableNodes = bulkContainerRef.current.children;

        for (let i = 0; i < tableNodes.length; i++) {
            const node = tableNodes[i] as HTMLElement;
            const tableNum = node.getAttribute('data-table');

            try {
                const canvas = await html2canvas(node, { scale: 2, useCORS: true });
                const dataUrl = canvas.toDataURL('image/png');
                folder?.file(`Table_${tableNum}.png`, dataUrl.split(',')[1], { base64: true });
            } catch (e) {
                console.error(`Failed to generate table ${tableNum}`, e);
            }
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${restaurant?.name || 'Restaurant'}_All_QR_Codes.zip`;
        link.click();

        toast({ title: "Bulk Download Complete", description: "Your zip file is ready." });
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-background">
            {/* Top Bar */}
            <div className="h-14 border-b flex items-center justify-between px-6 bg-card">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard/tables">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="font-semibold text-lg">QR Designer</h1>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Editing: {design.tableNumber ? `Table ${design.tableNumber}` : 'Global Template'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Template
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadSingle('pdf')}>
                        <Printer className="h-4 w-4 mr-2" />
                        PDF
                    </Button>
                    <Button size="sm" onClick={() => handleDownloadSingle('png')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleDownloadBulk}>
                        Download All ({tables.length})
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Preview Area */}
                <div className="flex-1 bg-muted/30 relative flex flex-col p-8 overflow-y-auto">
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <QRPreview
                            design={design}
                            background={currentBackground}
                            restaurantLogo={restaurant?.logoUrl} // Updated to match Firebase interface camelCase
                            forwardedRef={previewRef}
                            restaurantId={restaurant?.id}
                        />
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                        Preview scale: 60% • Real size: {design.layout === 'portrait' ? '600x800px' : '600x600px'}
                    </p>
                </div>

                {/* Right: Controls */}
                <div className="w-[400px] border-l bg-card shadow-xl z-10 flex flex-col">
                    <QRControls
                        design={design}
                        onUpdate={handleUpdateDesign}
                        onApplyTemplate={(tmpl) => setDesign(prev => ({ ...prev, ...tmpl }))}
                    />
                </div>
            </div>

            {/* Hidden Container for Bulk Export Generation */}
            <div
                className="fixed top-[200vh] left-0 pointer-events-none opacity-0 flex flex-wrap"
                ref={bulkContainerRef}
            >
                {tables.map(table => (
                    <div key={table.id} data-table={table.number}>
                        <QRPreview
                            design={{ ...design, tableNumber: table.number.toString() }}
                            background={currentBackground}
                            restaurantLogo={restaurant?.logoUrl}
                            forwardedRef={{ current: null } as any}
                            restaurantId={restaurant?.id}
                        />
                    </div>
                ))}
            </div>

        </div>
    );
};

export default QRDesignerPage;
