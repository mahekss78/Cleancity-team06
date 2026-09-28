/**
 * reportService.js
 * Utility to generate and download CSV files for waste collection intelligence.
 */

export const generateCollectionCSV = (data) => {
    if (!data || data.length === 0) return;

    // Define CSV Headers
    const headers = [
        "Report ID",
        "Finalized Date",
        "Authorization Status",
        "Admin Remarks",
        "Resident Name",
        "Resident Phone",
        "Location Address",
        "Driver Name",
        "Driver Plate",
        "Waste Category",
        "Material",
        "Volume Load",
        "Hazards Detected"
    ];

    // Map data to rows
    const rows = data.map(item => [
        item._id,
        item.finalizedAt ? new Date(item.finalizedAt).toLocaleDateString() : 'N/A',
        item.isAuthorized ? "AUTHORIZED" : "UNAUTHORIZED",
        `"${item.adminRemarks || 'N/A'}"`,
        item.user?.name || 'N/A',
        item.user?.phone || 'N/A',
        `"${item.locationName || item.address || 'N/A'}"`,
        item.assignedDriver?.name || 'N/A',
        item.assignedDriver?.plateNumber || 'N/A',
        item.wasteSummary?.category || 'N/A',
        item.wasteSummary?.material || 'N/A',
        item.wasteSummary?.volume || 'N/A',
        item.wasteSummary?.hazards || 'None'
    ]);

    // Construct CSV String
    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CleanCity_Intelligence_Report_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
