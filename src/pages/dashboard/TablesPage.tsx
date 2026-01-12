import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  QrCode,
  Users,
  Lock,
  Unlock,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  FileDown,
  Palette,
} from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Table } from "@/types/models";
import { addTable, updateTable, deleteTable, getTables } from "@/services/firebaseService";

// Map types
export type TableRow = Table;

const getStatusConfig = (status: string | null, isLocked: boolean | null) => {
  if (isLocked) {
    return { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Locked" };
  }
  switch (status) {
    case "available":
      return { color: "bg-success/10 text-success border-success/20", label: "Available" };
    case "occupied":
      return { color: "bg-warning/10 text-warning border-warning/20", label: "Occupied" };
    case "reserved":
      return { color: "bg-info/10 text-info border-info/20", label: "Reserved" };
    default:
      return { color: "bg-muted text-muted-foreground border-border", label: status || "Unknown" };
  }
};

export const TablesPage = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("4");
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  // Fetch restaurant and tables
  useEffect(() => {
    // If we have restaurantId from userProfile, use it
    if (userProfile?.restaurantId) {
      setRestaurantId(userProfile.restaurantId);
      getTables(userProfile.restaurantId).then((data) => {
        setTables(data);
        setIsLoading(false);
      }).catch(err => {
        console.error(err);
        toast.error("Failed to load tables");
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [userProfile]);

  const handleAddTable = async () => {
    if (!restaurantId || !newTableNumber) return;

    try {
      const tableData = {
        restaurantId,
        number: newTableNumber,
        seats: parseInt(newTableSeats) || 4,
        status: "available" as const,
        isLocked: false
      };
      const newTable = await addTable(tableData);
      setTables([...tables, newTable]);
      toast.success("Table added successfully");
      setIsAddDialogOpen(false);
      setNewTableNumber("");
      setNewTableSeats("4");
    } catch (e) {
      toast.error("Failed to add table");
    }
  };

  const handleEditTable = async () => {
    if (!selectedTable) return;

    try {
      const updates = {
        number: newTableNumber,
        seats: parseInt(newTableSeats) || 4,
      };
      await updateTable(selectedTable.id!, updates);
      setTables(tables.map(t => t.id === selectedTable.id ? { ...t, ...updates } : t));
      toast.success("Table updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTable(null);
    } catch (e) {
      toast.error("Failed to update table");
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;

    try {
      await deleteTable(selectedTable.id!);
      setTables(tables.filter(t => t.id !== selectedTable.id));
      toast.success("Table deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedTable(null);
    } catch (e) {
      toast.error("Failed to delete table");
    }
  };

  const handleToggleLock = async (table: TableRow) => {
    try {
      await updateTable(table.id!, { isLocked: !table.isLocked });
      setTables(tables.map(t => t.id === table.id ? { ...t, isLocked: !table.isLocked } : t));
      toast.success(table.isLocked ? "Table unlocked" : "Table locked");
    } catch (e) {
      toast.error("Failed to update table");
    }
  };

  const getQRCodeUrl = (table: TableRow) => {
    // Using the specific requested format or existing logic
    // We can fallback to logic if qrCodeUrl stored in DB is empty
    return table.qrCodeUrl || `${window.location.origin}/menu?r=${restaurantId}&t=${table.id}`;
  };

  const handleDownloadQR = (table: TableRow) => {
    const svg = document.getElementById(`qr-${table.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `table-${table.number}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadAllQRCodes = async () => {
    if (tables.length === 0) {
      toast.error("No tables to generate QR codes for");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-generation" });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const qrSize = 55;
    const cols = 3;
    const rows = 4;
    const cellWidth = (pageWidth - margin * 2) / cols;
    const cellHeight = (pageHeight - margin * 2) / rows;

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const col = i % cols;
      const row = Math.floor((i % (cols * rows)) / cols);

      // Add new page if needed
      if (i > 0 && i % (cols * rows) === 0) {
        pdf.addPage();
      }

      const x = margin + col * cellWidth + (cellWidth - qrSize) / 2;
      const y = margin + row * cellHeight + 5;

      // Get QR code as image
      const svg = document.getElementById(`qr-${table.id}`);
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx?.drawImage(img, 0, 0);
            resolve();
          };
          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        });

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);

        // Add table label
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Table ${table.number}`, x + qrSize / 2, y + qrSize + 8, { align: "center" });

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${table.seats || 4} seats`, x + qrSize / 2, y + qrSize + 13, { align: "center" });
      }
    }

    pdf.save("table-qr-codes.pdf");
    toast.success("PDF downloaded successfully!", { id: "pdf-generation" });
  };

  const openEditDialog = (table: TableRow) => {
    setSelectedTable(table);
    setNewTableNumber(table.number);
    setNewTableSeats((table.seats || 4).toString());
    setIsEditDialogOpen(true);
  };

  const openQRDialog = (table: TableRow) => {
    setSelectedTable(table);
    setIsQRDialogOpen(true);
  };

  const openDeleteDialog = (table: TableRow) => {
    if (table.isLocked) {
      toast.error("Cannot delete table with active order. Please complete or cancel the order first.");
      return;
    }
    setSelectedTable(table);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availableCount = tables.filter(t => t.status === "available" && !t.isLocked).length;
  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const lockedCount = tables.filter(t => t.isLocked).length;
  const reservedCount = tables.filter(t => t.status === "reserved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            {availableCount} of {tables.length} tables available
          </p>
        </div>
        <div className="flex gap-2">
          {tables.length > 0 && (
            <Button variant="outline" onClick={handleDownloadAllQRCodes}>
              <FileDown className="h-4 w-4 mr-2" />
              Download All QR Codes
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/dashboard/qr-designer')}>
            <Palette className="h-4 w-4 mr-2" />
            QR Designer
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>
                  Create a new table for your restaurant.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Table Number</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    placeholder="13"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Number of Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    placeholder="4"
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTable}>
                  Create Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available", value: availableCount, color: "text-success" },
          { label: "Occupied", value: occupiedCount, color: "text-warning" },
          { label: "Locked", value: lockedCount, color: "text-destructive" },
          { label: "Reserved", value: reservedCount, color: "text-info" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No tables yet</h3>
          <p className="text-muted-foreground mb-4">Add your first table to generate a QR code for ordering.</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {tables.map((table, index) => {
            const statusConfig = getStatusConfig(table.status, table.isLocked);
            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="relative bg-card rounded-xl border-2 p-4 transition-all hover:shadow-md border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Table {table.number}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {table.seats || 4} seats
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/qr-designer?table=${table.number}`)}>
                        <Palette className="h-4 w-4 mr-2" />
                        Customize Design
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openQRDialog(table)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR Code
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadQR(table)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download QR
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(table)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Table
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(table)}>
                        {table.isLocked ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock Table
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Lock Table
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDeleteDialog(table)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Table
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Badge variant="outline" className={`${statusConfig.color} w-full justify-center`}>
                  {statusConfig.label}
                </Badge>

                {/* Hidden QR for download */}
                <div className="hidden">
                  <QRCodeSVG
                    id={`qr-${table.id}`}
                    value={getQRCodeUrl(table)}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update table details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTableNumber">Table Number</Label>
              <Input
                id="editTableNumber"
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSeats">Number of Seats</Label>
              <Input
                id="editSeats"
                type="number"
                value={newTableSeats}
                onChange={(e) => setNewTableSeats(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTable}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - Table {selectedTable?.number}</DialogTitle>
            <DialogDescription>
              Customers can scan this code to view the menu and place orders.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6" ref={qrRef}>
            {selectedTable && (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={getQRCodeUrl(selectedTable)}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Table {selectedTable.number} • {selectedTable.seats || 4} seats
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-all max-w-full px-4 text-center">
                  {getQRCodeUrl(selectedTable)}
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQRDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedTable && handleDownloadQR(selectedTable)}>
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table {selectedTable?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the table and its QR code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
