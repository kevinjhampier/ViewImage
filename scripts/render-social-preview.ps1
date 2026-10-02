# Render the code-defined sharing card on Windows, using built-in .NET drawing.
# No downloaded fonts or image-editing service is required.
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputFile = Join-Path $projectRoot 'docs\assets\social-preview.png'
Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::new(1280, 640)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#202a23'))
$muted = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#586257'))
$accent = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#d9ef83'))
$white = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#fffef9'))
$line = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#cbd3bc'), 2)
$headingFont = [System.Drawing.Font]::new('Segoe UI', 64, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleFont = [System.Drawing.Font]::new('Segoe UI', 27, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new('Segoe UI', 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$smallFont = [System.Drawing.Font]::new('Consolas', 17, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#f5f4ec'))
    $graphics.DrawString('View Image', $titleFont, $ink, 64, 48)
    $graphics.DrawString('/ MAINTAINED', $smallFont, $muted, 236, 60)
    $graphics.DrawLine($line, 64, 116, 1216, 116)
    $graphics.DrawString('One click.', $headingFont, $ink, 58, 168)
    $graphics.DrawString('The actual image.', $headingFont, $ink, 58, 248)
    $graphics.DrawString('Bring the button back to Google Images.', $bodyFont, $muted, 64, 360)
    $graphics.FillRectangle($accent, 864, 157, 352, 300)
    $graphics.DrawRectangle($line, 888, 184, 304, 163)
    $graphics.DrawEllipse($line, 1116, 207, 34, 34)
    $graphics.DrawLines($line, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(909, 327), [System.Drawing.Point]::new(993, 253),
        [System.Drawing.Point]::new(1053, 304), [System.Drawing.Point]::new(1092, 271),
        [System.Drawing.Point]::new(1172, 327)
    ))
    $graphics.FillRectangle($ink, 888, 374, 304, 53)
    $graphics.DrawString('View image  >', $bodyFont, $white, 951, 384)
    $graphics.DrawLine($line, 64, 511, 1216, 511)
    $graphics.DrawString('FIREFOX + CHROMIUM', $smallFont, $ink, 64, 553)
    $graphics.DrawString('FREE / OPEN SOURCE / MIT', $smallFont, $muted, 305, 553)
    $graphics.DrawString('kevinjhampier.github.io/ViewImage', $smallFont, $muted, 864, 553)
    $bitmap.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    foreach ($resource in @($graphics, $bitmap, $ink, $muted, $accent, $white, $line, $headingFont, $titleFont, $bodyFont, $smallFont)) {
        $resource.Dispose()
    }
}
Get-Item -LiteralPath $outputFile | Select-Object FullName, Length
