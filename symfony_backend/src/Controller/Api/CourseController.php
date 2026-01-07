<?php

namespace App\Controller\Api;

use App\Entity\Course;
use App\Repository\CourseRepository;
use App\Repository\StudentGroupRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class CourseController extends AbstractController
{
    #[Route('/groups/{groupId}/courses', name: 'api_group_courses', methods: ['GET'])]
    public function getCoursesByGroup(
        int $groupId,
        StudentGroupRepository $groupRepo,
        CourseRepository $courseRepo
    ): JsonResponse {
        $group = $groupRepo->find($groupId);
        if (!$group) {
            return new JsonResponse(['error' => 'Group not found'], 404);
        }

        $courses = $courseRepo->findBy(['group' => $group]);
        $data = [];
        foreach ($courses as $course) {
            $data[] = [
                'id' => $course->getId(),
                'title' => $course->getTitle(),
                'type' => $course->getType(),
                'filePath' => $course->getFilePath(),
                'createdAt' => $course->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }

        return new JsonResponse($data);
    }

    #[Route('/groups/{groupId}/courses', name: 'api_create_course', methods: ['POST'])]
    public function createCourse(
        int $groupId,
        StudentGroupRepository $groupRepo,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $group = $groupRepo->find($groupId);
        if (!$group) {
            return new JsonResponse(['error' => 'Group not found'], 404);
        }

        $title = $request->request->get('title');
        $type = $request->request->get('type');
        $file = $request->files->get('file');

        if (!$title || !$type || !$file) {
            return new JsonResponse(['error' => 'Invalid data'], 400);
        }

        $filename = uniqid() . '.' . $file->guessExtension();
        $file->move(
            $this->getParameter('uploads_directory'), // set in services.yaml
            $filename
        );

        $course = new Course();
        $course->setTitle($title);
        $course->setType($type);
        $course->setFilePath('/uploads/' . $filename);
        $course->setGroup($group);
        $course->setCreatedAt(new \DateTimeImmutable());

        $em->persist($course);
        $em->flush();

        return new JsonResponse([
            'message' => 'Course created',
            'id' => $course->getId()
        ], 201);
    }

    #[Route('/courses/{id}', name: 'api_update_course', methods: ['PUT'])]
    public function updateCourse(
        int $id,
        Request $request,
        CourseRepository $courseRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $course = $courseRepo->find($id);
        if (!$course) {
            return new JsonResponse(['error' => 'Course not found'], 404);
        }

        $title = $request->request->get('title');
        $type = $request->request->get('type');
        $file = $request->files->get('file');

        if ($title) $course->setTitle($title);
        if ($type) $course->setType($type);

        if ($file) {
            // Remove old file if exists
            $oldPath = $this->getParameter('kernel.project_dir') . '/public' . $course->getFilePath();
            if (file_exists($oldPath)) unlink($oldPath);

            $filename = uniqid() . '.' . $file->guessExtension();
            $file->move($this->getParameter('uploads_directory'), $filename);
            $course->setFilePath('/uploads/' . $filename);
        }

        $em->flush();

        return new JsonResponse(['message' => 'Course updated']);
    }


    #[Route('/courses/{id}', name: 'api_delete_course', methods: ['DELETE'])]
    public function deleteCourse(
        int $id,
        CourseRepository $courseRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $course = $courseRepo->find($id);
        if (!$course) {
            return new JsonResponse(['error' => 'Course not found'], 404);
        }

        $filePath = $this->getParameter('kernel.project_dir') . '/public' . $course->getFilePath();
        if (file_exists($filePath)) unlink($filePath);

        $em->remove($course);
        $em->flush();

        return new JsonResponse(['message' => 'Course deleted']);
    }

    #[Route('/courses/{id}/file', name: 'api_course_file', methods: ['GET'])]
    public function getCourseFile(
        int $id,
        CourseRepository $courseRepo
    ): BinaryFileResponse {
        $course = $courseRepo->find($id);
        if (!$course) {
            throw $this->createNotFoundException('Course not found');
        }

        $filePath = $this->getParameter('kernel.project_dir') . '/public' . $course->getFilePath();
        if (!file_exists($filePath)) {
            throw $this->createNotFoundException('File not found');
        }

        return $this->file($filePath, basename($filePath), ResponseHeaderBag::DISPOSITION_INLINE);
    }
}
