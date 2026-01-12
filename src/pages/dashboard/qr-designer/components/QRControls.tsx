import { QRDesignState, BackgroundOption } from "../types";
import { BACKGROUNDS, PRESET_TEMPLATES } from "../constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface QRControlsProps {
    design: QRDesignState;
    onUpdate: (updates: Partial<QRDesignState>) => void;
    onApplyTemplate: (templateDesign: Partial<QRDesignState>) => void;
}

export const QRControls = ({ design, onUpdate, onApplyTemplate }: QRControlsProps) => {

    const handleDeepUpdate = (section: keyof QRDesignState, key: string, value: any) => {
        onUpdate({
            [section]: {
                ...(design[section] as any),
                [key]: value
            }
        } as any);
    };

    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue="design" className="w-full flex-1 flex flex-col">
                <div className="px-6 pt-4">
                    <TabsList className="w-full grid grid-cols-4">
                        <TabsTrigger value="design">Design</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="style">Style</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[calc(100vh-200px)] px-6 py-4">

                        {/* --- DESIGN TAB --- */}
                        <TabsContent value="design" className="space-y-6 mt-0">
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">Background Theme</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {BACKGROUNDS.map((bg) => (
                                        <button
                                            key={bg.id}
                                            onClick={() => onUpdate({ backgroundId: bg.id })}
                                            className={cn(
                                                "relative h-24 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                                                design.backgroundId === bg.id ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-transparent"
                                            )}
                                        >
                                            <div className="absolute inset-0" style={bg.style} />
                                            {design.backgroundId === bg.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <div className="bg-white rounded-full p-1 shadow-sm">
                                                        <Check className="h-4 w-4 text-primary" />
                                                    </div>
                                                </div>
                                            )}
                                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate text-center font-medium">
                                                {bg.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label className="text-base font-semibold">Layout & Format</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Orientation</Label>
                                        <Select value={design.layout} onValueChange={(v: any) => onUpdate({ layout: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="portrait">Portrait (600x800)</SelectItem>
                                                <SelectItem value="square">Square (600x600)</SelectItem>
                                                <SelectItem value="landscape">Landscape (800x600)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Paper Size</Label>
                                        <Select value={design.paperFormat} onValueChange={(v: any) => onUpdate({ paperFormat: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A5">A5</SelectItem>
                                                <SelectItem value="A6">A6</SelectItem>
                                                <SelectItem value="TableCard">Table Tent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- CONTENT TAB --- */}
                        <TabsContent value="content" className="space-y-6 mt-0">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label>Restaurant Name</Label>
                                    <Input
                                        value={design.restaurantName}
                                        onChange={(e) => onUpdate({ restaurantName: e.target.value })}
                                        placeholder="e.g. The Burger Joint"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Size</Label>
                                            <Slider
                                                value={[design.restaurantNameStyle.fontSize]}
                                                min={16} max={64} step={1}
                                                onValueChange={([val]) => handleDeepUpdate('restaurantNameStyle', 'fontSize', val)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Weight</Label>
                                            <Select
                                                value={design.restaurantNameStyle.fontWeight}
                                                onValueChange={(v) => handleDeepUpdate('restaurantNameStyle', 'fontWeight', v)}
                                            >
                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="normal">Normal</SelectItem>
                                                    <SelectItem value="bold">Bold</SelectItem>
                                                    <SelectItem value="extra-bold">Extra Bold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">Color:</Label>
                                        <input
                                            type="color"
                                            aria-label="Restaurant Name Color"
                                            value={design.restaurantNameStyle.color}
                                            onChange={(e) => handleDeepUpdate('restaurantNameStyle', 'color', e.target.value)}
                                            className="h-6 w-12 p-0 border rounded cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <Label>Table Label</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            value={design.tableNumber}
                                            onChange={(e) => onUpdate({ tableNumber: e.target.value })}
                                            placeholder="1"
                                        />
                                        <Select
                                            value={design.tableNumberStyle.prefix}
                                            onValueChange={(v) => handleDeepUpdate('tableNumberStyle', 'prefix', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Table #">Table #1</SelectItem>
                                                <SelectItem value="Table ">Table 1</SelectItem>
                                                <SelectItem value="#">#1</SelectItem>
                                                <SelectItem value="">1 (No prefix)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Size</Label>
                                        <Slider
                                            value={[design.tableNumberStyle.fontSize]}
                                            min={24} max={96} step={1}
                                            onValueChange={([val]) => handleDeepUpdate('tableNumberStyle', 'fontSize', val)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">Color:</Label>
                                        <input
                                            type="color"
                                            aria-label="Table Number Color"
                                            value={design.tableNumberStyle.color}
                                            onChange={(e) => handleDeepUpdate('tableNumberStyle', 'color', e.target.value)}
                                            className="h-6 w-12 p-0 border rounded cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <Label>Greeting Message</Label>
                                    <Input
                                        value={design.greeting}
                                        onChange={(e) => onUpdate({ greeting: e.target.value })}
                                        placeholder="Scan to Order"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {["Scan to Order", "Digital Menu", "Welcome!"].map(txt => (
                                            <BadgeButton key={txt} onClick={() => onUpdate({ greeting: txt })} label={txt} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Size</Label>
                                            <Slider
                                                value={[design.greetingStyle.fontSize]}
                                                min={12} max={32} step={1}
                                                onValueChange={([val]) => handleDeepUpdate('greetingStyle', 'fontSize', val)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <Label className="text-xs">Color:</Label>
                                            <input
                                                type="color"
                                                aria-label="Greeting Color"
                                                value={design.greetingStyle.color}
                                                onChange={(e) => handleDeepUpdate('greetingStyle', 'color', e.target.value)}
                                                className="h-6 w-12 p-0 border rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <Label>Footer & Icons</Label>
                                    <div className="grid gap-3">
                                        <Input
                                            value={design.footerText}
                                            onChange={(e) => onUpdate({ footerText: e.target.value })}
                                            placeholder="Footer text..."
                                        />
                                        <div className="space-y-2">
                                            <Label className="text-xs">Decorative Icon</Label>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {["", "🍕", "🍔", "🍜", "🍰", "☕", "🍷", "🥗", "🍣"].map(icon => (
                                                    <button
                                                        key={icon || 'none'}
                                                        onClick={() => onUpdate({ icon })}
                                                        className={cn(
                                                            "h-8 w-8 flex items-center justify-center rounded border hover:bg-muted",
                                                            design.icon === icon ? "bg-primary/20 border-primary" : ""
                                                        )}
                                                    >
                                                        {icon || <span className="text-xs text-muted-foreground">None</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- STYLE TAB --- */}
                        <TabsContent value="style" className="space-y-6 mt-0">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-medium">QR Appearance</Label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Size</Label>
                                            <Select
                                                value={design.qrStyle.size}
                                                onValueChange={(v) => handleDeepUpdate('qrStyle', 'size', v)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="small">Small</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="large">Large</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Corners</Label>
                                            <Select
                                                value={design.qrStyle.cornerStyle}
                                                onValueChange={(v) => handleDeepUpdate('qrStyle', 'cornerStyle', v)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="square">Square</SelectItem>
                                                    <SelectItem value="rounded">Rounded</SelectItem>
                                                    <SelectItem value="dots">Dots</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Embed Logo</Label>
                                        <Switch
                                            checked={design.qrStyle.logoEnabled}
                                            onCheckedChange={(c) => handleDeepUpdate('qrStyle', 'logoEnabled', c)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Container Border</Label>
                                        <Switch
                                            checked={design.qrStyle.border}
                                            onCheckedChange={(c) => handleDeepUpdate('qrStyle', 'border', c)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <Label className="text-base font-medium">Colors</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">QR Dots</Label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    aria-label="QR Color"
                                                    value={design.qrStyle.color}
                                                    onChange={(e) => handleDeepUpdate('qrStyle', 'color', e.target.value)}
                                                    className="h-8 w-full p-0 border rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">QR Background</Label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    aria-label="QR Background Color"
                                                    value={design.qrStyle.bgColor}
                                                    onChange={(e) => handleDeepUpdate('qrStyle', 'bgColor', e.target.value)}
                                                    className="h-8 w-full p-0 border rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- TEMPLATES TAB --- */}
                        <TabsContent value="templates" className="space-y-6 mt-0">
                            <div className="grid grid-cols-1 gap-4">
                                {PRESET_TEMPLATES.map((tmpl, idx) => (
                                    <Card
                                        key={idx}
                                        className="p-3 cursor-pointer hover:border-primary transition-all flex items-center gap-4 group"
                                        onClick={() => onApplyTemplate(tmpl.design)}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold group-hover:text-primary transition-colors">{tmpl.name}</h4>
                                            <p className="text-xs text-muted-foreground">Click to apply</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                    </ScrollArea>
                </div>
            </Tabs>
        </div>
    );
};

const BadgeButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80 transition-colors"
    >
        {label}
    </button>
);
