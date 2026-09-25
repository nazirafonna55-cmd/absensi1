// ======================================================
// ABSENSI QR - SCRIPT.JS
// ======================================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ======================================================
// VARIABEL
// ======================================================

let html5QrCode = null;
let npmMahasiswa = "";
let namaMahasiswa = "";


// ======================================================
// TUNGGU HTML SELESAI DIMUAT
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("JavaScript Absensi QR berhasil dimuat.");

    // --------------------------------------------------
    // TOMBOL BUAT QR
    // --------------------------------------------------

    const tombolQR = document.getElementById("btnBuatQR");

    if (tombolQR) {

        tombolQR.addEventListener("click", buatQR);

        console.log("Tombol Buat QR berhasil terhubung.");

    } else {

        console.error(
            "ERROR: Elemen dengan id 'btnBuatQR' tidak ditemukan."
        );

    }


    // --------------------------------------------------
    // BAGIAN QR
    // --------------------------------------------------

    const bagianQR = document.getElementById("bagianQR");

    if (bagianQR) {

        // Cegah tombol scan dibuat berkali-kali
        if (!document.getElementById("btnScanQR")) {

            const tombolScan = document.createElement("button");

            tombolScan.id = "btnScanQR";

            tombolScan.type = "button";

            tombolScan.textContent = "📷 Scan QR";

            tombolScan.style.marginTop = "15px";

            tombolScan.style.padding = "12px 20px";

            tombolScan.style.border = "none";

            tombolScan.style.borderRadius = "10px";

            tombolScan.style.cursor = "pointer";

            tombolScan.style.background =
                "linear-gradient(135deg, #4f46e5, #06b6d4)";

            tombolScan.style.color = "white";

            tombolScan.style.fontWeight = "600";

            tombolScan.addEventListener(
                "click",
                mulaiScan
            );

            bagianQR.appendChild(tombolScan);

        }

    }

});


// ======================================================
// FUNGSI PESAN
// ======================================================

function tampilkanPesan(teks, warna) {

    const pesan = document.getElementById("pesan");

    if (!pesan) {
        console.error("Elemen #pesan tidak ditemukan.");
        return;
    }

    pesan.style.color = warna;

    pesan.textContent = teks;

}


// ======================================================
// BUAT QR ABSENSI
// ======================================================

async function buatQR() {

    console.log("Tombol Buat QR diklik.");

    const inputNim =
        document.getElementById("nim");

    if (!inputNim) {

        console.error(
            "Input dengan id 'nim' tidak ditemukan."
        );

        tampilkanPesan(
            "Input NIM/NPM tidak ditemukan.",
            "#dc2626"
        );

        return;
    }


    const nim =
        inputNim.value.trim();


    // --------------------------------------------------
    // CEK NPM KOSONG
    // --------------------------------------------------

    if (nim === "") {

        tampilkanPesan(
            "Silakan masukkan NPM terlebih dahulu.",
            "#dc2626"
        );

        inputNim.focus();

        return;
    }


    tampilkanPesan(
        "Memeriksa NPM...",
        "#2563eb"
    );


    try {

        // ==================================================
        // CEK MAHASISWA
        // ==================================================

        console.log(
            "Memeriksa mahasiswa:",
            nim
        );


        const mahasiswaRef =
            doc(
                db,
                "mahasiswa",
                nim
            );


        const mahasiswaSnap =
            await getDoc(mahasiswaRef);


        if (!mahasiswaSnap.exists()) {

            tampilkanPesan(
                "NPM belum terdaftar di Firebase.",
                "#dc2626"
            );

            console.log(
                "NPM tidak ditemukan:",
                nim
            );

            return;
        }


        // Ambil data mahasiswa

        const dataMahasiswa =
            mahasiswaSnap.data();


        npmMahasiswa = nim;


        namaMahasiswa =
            dataMahasiswa.nama ||
            "Mahasiswa";


        console.log(
            "Mahasiswa ditemukan:",
            namaMahasiswa
        );


        // ==================================================
        // CARI SESI ABSENSI AKTIF
        // ==================================================

        tampilkanPesan(
            "Mencari sesi absensi aktif...",
            "#2563eb"
        );


        const sesiQuery =
            query(
                collection(db, "sesi"),
                where(
                    "aktif",
                    "==",
                    true
                )
            );


        const sesiSnapshot =
            await getDocs(sesiQuery);


        // --------------------------------------------------
        // TIDAK ADA SESI
        // --------------------------------------------------

        if (sesiSnapshot.empty) {

            tampilkanPesan(
                "Belum ada sesi absensi yang aktif.",
                "#dc2626"
            );

            console.log(
                "Tidak ada sesi aktif."
            );

            return;
        }


        // ==================================================
        // AMBIL SESI TERAKHIR
        // ==================================================

        const sesiDoc =
            sesiSnapshot.docs[
                sesiSnapshot.docs.length - 1
            ];


        const dataSesi =
            sesiDoc.data();


        const kodeSesi =
            dataSesi.kodeSesi;


        console.log(
            "Sesi aktif:",
            kodeSesi
        );


        if (!kodeSesi) {

            tampilkanPesan(
                "Kode sesi absensi tidak ditemukan.",
                "#dc2626"
            );

            return;
        }


        // ==================================================
        // DATA YANG DIMASUKKAN KE QR
        // ==================================================

        const dataQR =
            JSON.stringify({

                kodeSesi: kodeSesi,

                npm: npmMahasiswa

            });


        console.log(
            "Data QR:",
            dataQR
        );


        // ==================================================
        // CEK CONTAINER QR
        // ==================================================

        const qrContainer =
            document.getElementById("qrcode");


        if (!qrContainer) {

            tampilkanPesan(
                "Tempat QR tidak ditemukan di halaman.",
                "#dc2626"
            );

            console.error(
                "Elemen #qrcode tidak ditemukan."
            );

            return;
        }


        // Bersihkan QR lama

        qrContainer.innerHTML = "";


        // ==================================================
        // CEK LIBRARY QRCode
        // ==================================================

        if (typeof QRCode === "undefined") {

            tampilkanPesan(
                "Library QR Code belum dimuat.",
                "#dc2626"
            );

            console.error(
                "QRCode tidak ditemukan. Pastikan library QRCode sudah ada di HTML."
            );

            return;
        }


        // ==================================================
        // BUAT QR
        // ==================================================

        new QRCode(
            qrContainer,
            {
                text: dataQR,

                width: 250,

                height: 250,

                correctLevel:
                    QRCode.CorrectLevel.M
            }
        );


        // ==================================================
        // TAMPILKAN BAGIAN QR
        // ==================================================

        const bagianQR =
            document.getElementById("bagianQR");


        if (bagianQR) {

            bagianQR.style.display = "block";

        }


        tampilkanPesan(
            "QR berhasil dibuat. Silakan scan QR tersebut.",
            "#16a34a"
        );


        console.log(
            "QR berhasil dibuat."
        );


    } catch (error) {

        console.error(
            "Gagal membuat QR:",
            error
        );


        tampilkanPesan(
            "Terjadi kesalahan saat membuat QR.",
            "#dc2626"
        );

    }

}


// ======================================================
// MULAI SCAN QR
// ======================================================

function mulaiScan() {

    console.log(
        "Tombol Scan QR diklik."
    );


    const scanner =
        document.getElementById("scanner");


    if (!scanner) {

        tampilkanPesan(
            "Tempat scanner tidak ditemukan.",
            "#dc2626"
        );

        console.error(
            "Elemen #scanner tidak ditemukan."
        );

        return;
    }


    // --------------------------------------------------
    // CEK LIBRARY SCANNER
    // --------------------------------------------------

    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        tampilkanPesan(
            "Library scanner belum dimuat.",
            "#dc2626"
        );

        console.error(
            "Html5Qrcode tidak ditemukan."
        );

        return;
    }


    // --------------------------------------------------
    // TAMPILKAN SCANNER
    // --------------------------------------------------

    scanner.style.display = "block";


    tampilkanPesan(
        "Arahkan kamera ke QR Absensi...",
        "#2563eb"
    );


    // --------------------------------------------------
    // HENTIKAN SCANNER LAMA JIKA ADA
    // --------------------------------------------------

    if (html5QrCode) {

        try {

            html5QrCode.stop();

        } catch (error) {

            console.log(
                "Tidak ada scanner lama."
            );

        }

        html5QrCode = null;

    }


    // ==================================================
    // BUAT SCANNER BARU
    // ==================================================

    html5QrCode =
        new Html5Qrcode(
            "scanner"
        );


    // ==================================================
    // MULAI KAMERA
    // ==================================================

    html5QrCode.start(

        {
            facingMode:
                "environment"
        },

        {
            fps: 10,

            qrbox: {
                width: 250,
                height: 250
            }

        },

        function (qrCodeMessage) {

            console.log(
                "QR terbaca:",
                qrCodeMessage
            );

            prosesScan(
                qrCodeMessage
            );

        },

        function (errorMessage) {

            // Error scan sementara
            // Tidak perlu ditampilkan
            // agar tidak mengganggu pengguna.

        }

    ).catch(
        function (error) {

            console.error(
                "Kamera gagal dibuka:",
                error
            );


            tampilkanPesan(
                "Kamera tidak dapat dibuka. Izinkan akses kamera.",
                "#dc2626"
            );

        }
    );

}


// ======================================================
// PROSES HASIL SCAN
// ======================================================

async function prosesScan(
    qrCodeMessage
) {

    try {

        console.log(
            "Memproses QR:",
            qrCodeMessage
        );


        // ==================================================
        // HENTIKAN SCANNER
        // ==================================================

        if (html5QrCode) {

            try {

                await html5QrCode.stop();

                console.log(
                    "Scanner dihentikan."
                );

            } catch (error) {

                console.log(
                    "Scanner sudah berhenti."
                );

            }

        }


        // ==================================================
        // BACA DATA QR
        // ==================================================

        let dataQR;


        try {

            dataQR =
                JSON.parse(
                    qrCodeMessage
                );

        } catch (error) {

            console.error(
                "QR bukan JSON:",
                error
            );

            alert(
                "QR tidak valid."
            );

            return;
        }


        const kodeSesi =
            dataQR.kodeSesi;


        const npm =
            dataQR.npm;


        // ==================================================
        // CEK DATA QR
        // ==================================================

        if (
            !kodeSesi ||
            !npm
        ) {

            alert(
                "QR tidak valid."
            );

            return;
        }


        console.log(
            "Kode sesi:",
            kodeSesi
        );

        console.log(
            "NPM:",
            npm
        );


        // ==================================================
        // CEK SESI
        // ==================================================

        const sesiQuery =
            query(
                collection(db, "sesi"),
                where(
                    "kodeSesi",
                    "==",
                    kodeSesi
                )
            );


        const sesiSnapshot =
            await getDocs(
                sesiQuery
            );


        if (
            sesiSnapshot.empty
        ) {

            alert(
                "Sesi absensi tidak ditemukan."
            );

            return;
        }


        const dataSesi =
            sesiSnapshot.docs[
                0
            ].data();


        // ==================================================
        // CEK SESI MASIH AKTIF
        // ==================================================

        if (
            dataSesi.aktif === false
        ) {

            alert(
                "Sesi absensi sudah tidak aktif."
            );

            return;
        }


        // ==================================================
        // CEK MAHASISWA
        // ==================================================

        const mahasiswaRef =
            doc(
                db,
                "mahasiswa",
                npm
            );


        const mahasiswaSnap =
            await getDoc(
                mahasiswaRef
            );


        if (
            !mahasiswaSnap.exists()
        ) {

            alert(
                "NPM belum terdaftar."
            );

            return;
        }


        const dataMahasiswa =
            mahasiswaSnap.data();


        const nama =
            dataMahasiswa.nama ||
            "Mahasiswa";


        // ==================================================
        // WAKTU
        // ==================================================

        const sekarang =
            new Date();


        const tanggal =
            sekarang.toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );


        const waktu =
            sekarang.toLocaleTimeString(
                "id-ID",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


        // ==================================================
        // ID ABSENSI
        // ==================================================

        const idAbsensi =
            npm +
            "_" +
            kodeSesi;


        // ==================================================
        // SIMPAN ABSENSI KE FIREBASE
        // ==================================================

        try {

            await setDoc(

                doc(
                    db,
                    "absensi",
                    idAbsensi
                ),

                {

                    nim: npm,

                    nama: nama,

                    mataKuliah:
                        dataSesi.mataKuliah ||
                        "-",

                    pertemuan:
                        dataSesi.pertemuan ||
                        "-",

                    kodeQR:
                        kodeSesi,

                    tanggal:
                        tanggal,

                    waktu:
                        waktu,

                    status:
                        "HADIR",

                    createdAt:
                        serverTimestamp()

                },

                {
                    merge: false
                }

            );


            console.log(
                "Absensi berhasil disimpan."
            );


        } catch (error) {

            console.error(
                "Gagal menyimpan absensi:",
                error
            );


            if (
                error.code ===
                "permission-denied"
            ) {

                alert(
                    "NPM ini sudah melakukan absensi untuk sesi tersebut."
                );

            } else {

                alert(
                    "Gagal menyimpan absensi ke Firebase."
                );

            }


            return;
        }


        // ==================================================
        // TAMPILKAN HASIL ABSENSI
        // ==================================================

        const hasilNim =
            document.getElementById(
                "hasilNim"
            );

        if (hasilNim) {

            hasilNim.textContent =
                npm;

        }


        const hasilNama =
            document.getElementById(
                "hasilNama"
            );

        if (hasilNama) {

            hasilNama.textContent =
                nama;

        }


        const hasilMatkul =
            document.getElementById(
                "hasilMatkul"
            );

        if (hasilMatkul) {

            hasilMatkul.textContent =
                dataSesi.mataKuliah ||
                "-";

        }


        const hasilPertemuan =
            document.getElementById(
                "hasilPertemuan"
            );

        if (hasilPertemuan) {

            hasilPertemuan.textContent =
                dataSesi.pertemuan ||
                "-";

        }


        const hasilTanggal =
            document.getElementById(
                "hasilTanggal"
            );

        if (hasilTanggal) {

            hasilTanggal.textContent =
                tanggal;

        }


        const hasilWaktu =
            document.getElementById(
                "hasilWaktu"
            );

        if (hasilWaktu) {

            hasilWaktu.textContent =
                waktu;

        }


        // ==================================================
        // PINDAH KE HALAMAN BERHASIL
        // ==================================================

        const halamanAwal =
            document.getElementById(
                "halamanAwal"
            );


        const halamanBerhasil =
            document.getElementById(
                "halamanBerhasil"
            );


        if (halamanAwal) {

            halamanAwal.style.display =
                "none";

        }


        if (halamanBerhasil) {

            halamanBerhasil.style.display =
                "flex";

        }


        console.log(
            "Absensi selesai."
        );


    } catch (error) {

        console.error(
            "QR tidak dapat diproses:",
            error
        );


        alert(
            "QR tidak valid atau terjadi kesalahan."
        );

    }

}
