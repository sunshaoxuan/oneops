param(
    [Parameter(Mandatory = $true)]
    [string]$Directory
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime

function Wait-WindowsRuntimeOperation {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Operation,
        [Parameter(Mandatory = $true)]
        [type]$ResultType
    )

    $method = [System.WindowsRuntimeSystemExtensions].GetMethods() |
        Where-Object {
            $_.Name -eq "AsTask" -and
            $_.IsGenericMethod -and
            $_.GetParameters().Count -eq 1
        } |
        Select-Object -First 1
    $task = $method.MakeGenericMethod($ResultType).Invoke(
        $null,
        @($Operation)
    )
    $task.GetAwaiter().GetResult()
}

try {
    [void][Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]
    [void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
    [void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
    [void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]

    $language = [Windows.Globalization.Language]::new("ja-JP")
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
    if ($null -eq $engine) {
        throw "Japanese Windows OCR is unavailable."
    }

    $results = [System.Collections.Generic.List[object]]::new()
    $files = Get-ChildItem -LiteralPath $Directory -Filter "*.png" |
        Sort-Object Name
    foreach ($fileInfo in $files) {
        $storageFile = Wait-WindowsRuntimeOperation `
            ([Windows.Storage.StorageFile]::GetFileFromPathAsync(
                $fileInfo.FullName
            )) `
            ([Windows.Storage.StorageFile])
        $stream = Wait-WindowsRuntimeOperation `
            ($storageFile.OpenAsync(
                [Windows.Storage.FileAccessMode]::Read
            )) `
            ([Windows.Storage.Streams.IRandomAccessStream])
        try {
            $decoder = Wait-WindowsRuntimeOperation `
                ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync(
                    $stream
                )) `
                ([Windows.Graphics.Imaging.BitmapDecoder])
            $bitmap = Wait-WindowsRuntimeOperation `
                ($decoder.GetSoftwareBitmapAsync()) `
                ([Windows.Graphics.Imaging.SoftwareBitmap])
            try {
                $ocrResult = Wait-WindowsRuntimeOperation `
                    ($engine.RecognizeAsync($bitmap)) `
                    ([Windows.Media.Ocr.OcrResult])
                $results.Add([ordered]@{
                    file = $fileInfo.Name
                    text = [string]$ocrResult.Text
                })
            }
            finally {
                if ($null -ne $bitmap) {
                    $bitmap.Dispose()
                }
            }
        }
        finally {
            if ($null -ne $stream) {
                $stream.Dispose()
            }
        }
    }

    [ordered]@{
        status = "PARSED"
        pages = $results
    } | ConvertTo-Json -Compress -Depth 5
}
catch {
    [ordered]@{
        status = "FAILED"
        errorCode = $_.Exception.GetType().Name
        message = $_.Exception.Message
        pages = @()
    } | ConvertTo-Json -Compress -Depth 5
}
