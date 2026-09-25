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


// ===============================
// VARIABEL
// ===============================

let html5QrCode;
let npmMahasiswa = "";
let namaMahasiswa = "";


// ===============================
// TOMBOL BUAT QR
// ===============================

document
    .getElementById("btnBuatQR")
    .addEventListener("click", buatQR);


// ===============================
// TOMBOL SCAN QR
// ===============================

document
    .getElementById("btnScan")
    .addEventListener("click", mulaiScan);


// ===============================
// HELPER: SET PESAN
// ===============================

function setPesan(teks, tipe = "info") {
    const pesan = document.getElementById("pesan");
    pesan.className = "pesan " + tipe;
    pesan.textContent = teks;
}


// ===============================
// BUAT QR
// ===============================

async function buatQR() {

    const nim =
        document.getElementById("nim").value.trim();

    if (nim === "") {
        setPesan("Silakan masukkan NPM terlebih dahulu.", "error");
        return;
    }

    setPesan("Memeriksa NPM...", "info");

    try {

        // ===============================
        // CEK MAHASISWA
        // ===============================

        const mahasiswaRef = doc(db, "mahasiswa", nim);
        const mahasiswaSnap = await getDoc(mahasiswaRef);

        if (!mahasiswaSnap.exists()) {
            setPesan("NPM belum terdaftar di Firebase.", "error");
            return;
        }

        const dataMahasiswa = mahasiswaSnap.data();

        npmMahasiswa = nim;
        namaMahasiswa = dataMahasiswa.nama || "Mahasiswa";


        // ===============================
        // CARI SESI AKTIF
        // ===============================

        const sesiQuery = query(
            collection(db, "sesi"),
            where("aktif", "==", true)
        );

        const sesiSnapshot = await getDocs(sesiQuery);

        if (sesiSnapshot.empty) {
            setPesan("Belum ada sesi absensi yang aktif.", "error");
            return;
        }

        // Ambil sesi terbaru
        const sesiDoc = sesiSnapshot.docs[sesiSnapshot.docs.length - 1];
        const dataSesi = sesiDoc.data();
        const kodeSesi = dataSesi.kodeSesi;


        // ===============================
        // BUAT DATA QR
        // ===============================

        const dataQR = JSON.stringify({
            kodeSesi: kodeSesi,
            npm: npmMahasiswa
        });

        // Bersihkan QR sebelumnya
        document.getElementById("qrcode").innerHTML = "";

        // Buat QR
        new QRCode(
            document.getElementById("qrcode"),
            {
                text: dataQR,
                width: 250,
                height: 250
            }
        );

        // Tampilkan QR
        document.getElementById("bagianQR").style.display = "block";

        setPesan(
            "QR berhasil dibuat. Silakan scan QR tersebut.",
            "success"
        );

    } catch (error) {

        console.error("Gagal membuat QR:", error);
        setPesan("Terjadi kesalahan saat membuat QR.", "error");
    }
}


// ===============================
// MULAI SCAN
// ===============================

function mulaiScan() {

    document.getElementById("scanner").style.display = "block";

    setPesan("Arahkan kamera ke QR Absensi...", "info");

    html5QrCode = new Html5Qrcode("scanner");

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const size = Math.floor(minEdge * 0.7);
                return { width: size, height: size };
            }
        },
        function (qrCodeMessage) {
            prosesScan(qrCodeMessage);
        },
        function (errorMessage) {
            // Abaikan error scan sementara
        }
    ).catch(function (error) {

        console.error(error);
        setPesan(
            "Kamera tidak dapat dibuka. Izinkan akses kamera.",
            "error"
        );
    });
}


// ===============================
// PROSES QR
// ===============================

async function prosesScan(qrCodeMessage) {

    try {

        // Hentikan scanner
        if (html5QrCode) {
            try {
                await html5QrCode.stop();
            } catch (e) {
                // scanner sudah berhenti, abaikan
            }
        }

        // ===============================
        // BACA DATA QR
        // ===============================

        const dataQR = JSON.parse(qrCodeMessage);
        const kodeSesi = dataQR.kodeSesi;
        const npm = dataQR.npm;

        if (!kodeSesi || !npm) {
            setPesan("QR tidak valid.", "error");
            return;
        }

        // ===============================
        // CEK SESI
        // ===============================

        const sesiQuery = query(
            collection(db, "sesi"),
            where("kodeSesi", "==", kodeSesi)
        );

        const sesiSnapshot = await getDocs(sesiQuery);

        if (sesiSnapshot.empty) {
            setPesan("Sesi absensi tidak ditemukan.", "error");
            return;
        }

        const dataSesi = sesiSnapshot.docs[0].data();

        // ===============================
        // CEK MAHASISWA
        // ===============================

        const mahasiswaRef = doc(db, "mahasiswa", npm);
        const mahasiswaSnap = await getDoc(mahasiswaRef);

        if (!mahasiswaSnap.exists()) {
            setPesan("NPM belum terdaftar.", "error");
            return;
        }

        const dataMahasiswa = mahasiswaSnap.data();
        const nama = dataMahasiswa.nama || "Mahasiswa";

        // ===============================
        // WAKTU
        // ===============================

        const sekarang = new Date();

        const tanggal = sekarang.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        const waktu = sekarang.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        // ===============================
        // ID ABSENSI
        // ===============================

        const idAbsensi = npm + "_" + kodeSesi;

        // ===============================
        // SIMPAN ABSENSI
        // ===============================

        try {

            await setDoc(
                doc(db, "absensi", idAbsensi),
                {
                    nim: npm,
                    nama: nama,
                    mataKuliah: dataSesi.mataKuliah || "-",
                    pertemuan: dataSesi.pertemuan || "-",
                    kodeQR: kodeSesi,
                    tanggal: tanggal,
                    waktu: waktu,
                    status: "HADIR",
                    createdAt: serverTimestamp()
                },
                { merge: false }
            );

        } catch (error) {

            console.error("Gagal menyimpan:", error);

            if (error.code === "permission-denied") {
                setPesan(
                    "NPM ini sudah melakukan absensi untuk sesi tersebut.",
                    "error"
                );
            } else {
                setPesan(
                    "Gagal menyimpan absensi ke Firebase.",
                    "error"
                );
            }

            return;
        }

        // ===============================
        // TAMPILKAN HASIL
        // ===============================

        document.getElementById("hasilNim").textContent = npm;
        document.getElementById("hasilNama").textContent = nama;
        document.getElementById("hasilMatkul").textContent = dataSesi.mataKuliah || "-";
        document.getElementById("hasilPertemuan").textContent = dataSesi.pertemuan || "-";
        document.getElementById("hasilTanggal").textContent = tanggal;
        document.getElementById("hasilWaktu").textContent = waktu;

        document.getElementById("halamanAwal").style.display = "none";
        document.getElementById("halamanBerhasil").style.display = "flex";

    } catch (error) {

        console.error("QR tidak dapat diproses:", error);
        setPesan("QR tidak valid atau terjadi kesalahan.", "error");
    }
}


// ===============================
// KEMBALI KE HALAMAN AWAL
// ===============================

window.kembaliKeHalamanAwal = function () {

    // Sembunyikan halaman berhasil
    document.getElementById("halamanBerhasil").style.display = "none";

    // Tampilkan halaman utama
    document.getElementById("halamanAwal").style.display = "block";

    // Bersihkan NPM
    document.getElementById("nim").value = "";

    // Bersihkan pesan
    const pesan = document.getElementById("pesan");
    pesan.className = "pesan";
    pesan.textContent = "";

    // Sembunyikan QR
    document.getElementById("bagianQR").style.display = "none";

    // Bersihkan QR
    document.getElementById("qrcode").innerHTML = "";

    // Sembunyikan scanner
    document.getElementById("scanner").style.display = "none";

    // Scroll ke daftar absensi
    setTimeout(function () {
        document.getElementById("daftar").scrollIntoView({
            behavior: "smooth"
        });
    }, 300);
};
